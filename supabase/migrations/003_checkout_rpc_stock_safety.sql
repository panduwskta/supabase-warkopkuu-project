-- Sprint 9 — Checkout RPC + Stock Safety
-- Scope: repository migration draft only. Do not apply to production without explicit approval.
-- Purpose: atomic cloud checkout sync for transaction + items + stock decrement.

create or replace function public.create_transaction_with_stock_update(payload jsonb)
returns jsonb
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_store_id uuid;
  v_payment_method_id uuid;
  v_transaction_id uuid;
  v_existing_transaction_id uuid;
  v_item jsonb;
  v_grouped_item record;
  v_product_id uuid;
  v_product_stock numeric;
  v_requested_quantity numeric;
  v_price_snapshot numeric;
  v_hpp_snapshot numeric;
  v_item_subtotal numeric;
  v_item_profit_estimate numeric;
  v_new_stock numeric;
  v_items jsonb;
  v_item_results jsonb := '[]'::jsonb;
  v_product_results jsonb := '[]'::jsonb;
  v_conflicts jsonb := '[]'::jsonb;
  v_now timestamptz := now();
begin
  if v_user_id is null then
    return jsonb_build_object(
      'ok', false,
      'code', 'UNAUTHENTICATED',
      'message', 'User must be authenticated to checkout.'
    );
  end if;

  if payload is null or jsonb_typeof(payload) <> 'object' then
    return jsonb_build_object(
      'ok', false,
      'code', 'INVALID_PAYLOAD',
      'message', 'Checkout payload must be a JSON object.'
    );
  end if;

  begin
    v_store_id := nullif(payload->>'storeId', '')::uuid;
  exception when others then
    return jsonb_build_object(
      'ok', false,
      'code', 'INVALID_PAYLOAD',
      'message', 'storeId must be a valid UUID.'
    );
  end;

  if v_store_id is null then
    return jsonb_build_object(
      'ok', false,
      'code', 'INVALID_PAYLOAD',
      'message', 'storeId is required.'
    );
  end if;

  if not exists (
    select 1
    from public.stores s
    where s.id = v_store_id
      and s.owner_user_id = v_user_id
      and s.deleted_at is null
  ) then
    return jsonb_build_object(
      'ok', false,
      'code', 'UNAUTHORIZED_STORE',
      'message', 'User cannot checkout for this store.'
    );
  end if;

  if length(trim(coalesce(payload->>'receiptNumber', ''))) = 0 then
    return jsonb_build_object(
      'ok', false,
      'code', 'INVALID_PAYLOAD',
      'message', 'receiptNumber is required.'
    );
  end if;

  select t.id
    into v_existing_transaction_id
  from public.transactions t
  where t.store_id = v_store_id
    and t.receipt_number = payload->>'receiptNumber'
  limit 1;

  if v_existing_transaction_id is not null then
    return jsonb_build_object(
      'ok', false,
      'code', 'DUPLICATE_RECEIPT',
      'message', 'Receipt number already exists for this store.',
      'transactionId', v_existing_transaction_id
    );
  end if;

  v_items := payload->'items';

  if v_items is null or jsonb_typeof(v_items) <> 'array' or jsonb_array_length(v_items) = 0 then
    return jsonb_build_object(
      'ok', false,
      'code', 'INVALID_PAYLOAD',
      'message', 'items must be a non-empty array.'
    );
  end if;

  begin
    v_payment_method_id := nullif(payload->>'paymentMethodId', '')::uuid;
  exception when others then
    return jsonb_build_object(
      'ok', false,
      'code', 'INVALID_PAYLOAD',
      'message', 'paymentMethodId must be a valid UUID when provided.'
    );
  end;

  if v_payment_method_id is not null and not exists (
    select 1
    from public.payment_methods pm
    where pm.id = v_payment_method_id
      and pm.store_id = v_store_id
      and pm.deleted_at is null
  ) then
    return jsonb_build_object(
      'ok', false,
      'code', 'INVALID_PAYLOAD',
      'message', 'paymentMethodId does not belong to this store.'
    );
  end if;

  -- Validate item payload before any writes.
  for v_item in select value from jsonb_array_elements(v_items)
  loop
    if jsonb_typeof(v_item) <> 'object' then
      return jsonb_build_object(
        'ok', false,
        'code', 'INVALID_PAYLOAD',
        'message', 'Each checkout item must be an object.'
      );
    end if;

    if length(trim(coalesce(v_item->>'productNameSnapshot', ''))) = 0 then
      return jsonb_build_object(
        'ok', false,
        'code', 'INVALID_PAYLOAD',
        'message', 'productNameSnapshot is required for every item.'
      );
    end if;

    begin
      v_product_id := nullif(v_item->>'productId', '')::uuid;
      v_requested_quantity := coalesce((v_item->>'quantity')::numeric, 0);
      v_price_snapshot := coalesce((v_item->>'priceSnapshot')::numeric, 0);
      v_hpp_snapshot := coalesce((v_item->>'hppSnapshot')::numeric, 0);
      v_item_subtotal := coalesce((v_item->>'subtotal')::numeric, 0);
      v_item_profit_estimate := coalesce((v_item->>'profitEstimate')::numeric, 0);
    exception when others then
      return jsonb_build_object(
        'ok', false,
        'code', 'INVALID_PAYLOAD',
        'message', 'Each item requires valid productId and numeric values.'
      );
    end;

    if v_product_id is null then
      return jsonb_build_object(
        'ok', false,
        'code', 'INVALID_PAYLOAD',
        'message', 'productId is required for cloud checkout sync.'
      );
    end if;

    if v_requested_quantity <= 0 then
      return jsonb_build_object(
        'ok', false,
        'code', 'INVALID_PAYLOAD',
        'message', 'Item quantity must be greater than 0.'
      );
    end if;

    if v_price_snapshot < 0
      or v_hpp_snapshot < 0
      or v_item_subtotal < 0 then
      return jsonb_build_object(
        'ok', false,
        'code', 'INVALID_PAYLOAD',
        'message', 'Item numeric values cannot be negative.'
      );
    end if;
  end loop;

  -- Lock products in deterministic order, then collect stock conflicts before writing.
  for v_grouped_item in
    select
      (item.value->>'productId')::uuid as product_id,
      max(item.value->>'productLocalId') as product_local_id,
      sum((item.value->>'quantity')::numeric) as requested_quantity
    from jsonb_array_elements(v_items) item
    group by (item.value->>'productId')::uuid
    order by (item.value->>'productId')::uuid
  loop
    select p.stock
      into v_product_stock
    from public.products p
    where p.id = v_grouped_item.product_id
      and p.store_id = v_store_id
      and p.is_deleted = false
      and p.deleted_at is null
    for update;

    if not found then
      return jsonb_build_object(
        'ok', false,
        'code', 'INVALID_PAYLOAD',
        'message', 'One or more products do not belong to this store or are deleted.',
        'productId', v_grouped_item.product_id
      );
    end if;

    if v_product_stock < v_grouped_item.requested_quantity then
      v_conflicts := v_conflicts || jsonb_build_array(jsonb_build_object(
        'productId', v_grouped_item.product_id,
        'productLocalId', v_grouped_item.product_local_id,
        'requestedQuantity', v_grouped_item.requested_quantity,
        'availableStock', v_product_stock
      ));
    end if;
  end loop;

  if jsonb_array_length(v_conflicts) > 0 then
    return jsonb_build_object(
      'ok', false,
      'code', 'INSUFFICIENT_STOCK',
      'message', 'Cloud stock is lower than checkout quantity.',
      'conflicts', v_conflicts
    );
  end if;

  begin
    insert into public.transactions (
      store_id,
      payment_method_id,
      receipt_number,
      transaction_date,
      subtotal,
      discount_amount,
      total,
      payment_method_snapshot,
      payment_amount,
      change_amount,
      profit_estimate,
      status,
      notes,
      is_deleted,
      is_sample
    ) values (
      v_store_id,
      v_payment_method_id,
      payload->>'receiptNumber',
      coalesce((payload->>'transactionDate')::timestamptz, v_now),
      coalesce((payload->>'subtotal')::numeric, 0),
      coalesce((payload->>'discountAmount')::numeric, 0),
      coalesce((payload->>'total')::numeric, 0),
      nullif(payload->>'paymentMethodSnapshot', ''),
      coalesce((payload->>'paymentAmount')::numeric, 0),
      coalesce((payload->>'changeAmount')::numeric, 0),
      coalesce((payload->>'profitEstimate')::numeric, 0),
      coalesce(nullif(payload->>'status', ''), 'completed'),
      nullif(payload->>'notes', ''),
      false,
      false
    ) returning id into v_transaction_id;

    for v_item in select value from jsonb_array_elements(v_items)
    loop
      insert into public.transaction_items (
        transaction_id,
        store_id,
        product_id,
        product_name_snapshot,
        price_snapshot,
        hpp_snapshot,
        quantity,
        subtotal,
        profit_estimate,
        notes
      ) values (
        v_transaction_id,
        v_store_id,
        (v_item->>'productId')::uuid,
        v_item->>'productNameSnapshot',
        coalesce((v_item->>'priceSnapshot')::numeric, 0),
        coalesce((v_item->>'hppSnapshot')::numeric, 0),
        (v_item->>'quantity')::numeric,
        coalesce((v_item->>'subtotal')::numeric, 0),
        coalesce((v_item->>'profitEstimate')::numeric, 0),
        nullif(v_item->>'notes', '')
      ) returning id into v_product_id;

      v_item_results := v_item_results || jsonb_build_array(jsonb_build_object(
        'localTransactionItemId', v_item->>'localTransactionItemId',
        'transactionItemId', v_product_id
      ));
    end loop;

    for v_grouped_item in
      select
        (item.value->>'productId')::uuid as product_id,
        max(item.value->>'productLocalId') as product_local_id,
        sum((item.value->>'quantity')::numeric) as requested_quantity
      from jsonb_array_elements(v_items) item
      group by (item.value->>'productId')::uuid
      order by (item.value->>'productId')::uuid
    loop
      update public.products p
      set stock = p.stock - v_grouped_item.requested_quantity
      where p.id = v_grouped_item.product_id
        and p.store_id = v_store_id
      returning p.stock into v_new_stock;

      v_product_results := v_product_results || jsonb_build_array(jsonb_build_object(
        'productLocalId', v_grouped_item.product_local_id,
        'productId', v_grouped_item.product_id,
        'stock', v_new_stock
      ));
    end loop;
  exception
    when unique_violation then
      select t.id
        into v_existing_transaction_id
      from public.transactions t
      where t.store_id = v_store_id
        and t.receipt_number = payload->>'receiptNumber'
      limit 1;

      return jsonb_build_object(
        'ok', false,
        'code', 'DUPLICATE_RECEIPT',
        'message', 'Receipt number already exists for this store.',
        'transactionId', v_existing_transaction_id
      );
    when check_violation or invalid_text_representation or numeric_value_out_of_range or not_null_violation then
      return jsonb_build_object(
        'ok', false,
        'code', 'INVALID_PAYLOAD',
        'message', 'Checkout payload failed database validation.'
      );
  end;

  return jsonb_build_object(
    'ok', true,
    'transactionId', v_transaction_id,
    'receiptNumber', payload->>'receiptNumber',
    'transactionItems', v_item_results,
    'products', v_product_results,
    'syncedAt', v_now
  );
end;
$$;

comment on function public.create_transaction_with_stock_update(jsonb)
is 'Warungin v2 checkout RPC draft: atomically inserts transaction/items and decrements product stock for the authenticated store owner.';
