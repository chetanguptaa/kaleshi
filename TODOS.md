# [P0]
1. Integrate Timeseries DB
2. Application should follow this architecture 
    1. Backend will take orders do its checks like balances and account creation.
    2. append it to the redis stream which will gets consumed by our MATCHING_ENGINE.
    3. Matching engine will contain a ledger which is basically our source of truth, we'll append users' orders to our ledger.
    4. Matching engine will create first event with following types: book.depth, market.data, order.filled, order.partial, order.cancelled, it has to do 2 things, first update our sqlite DB with new user checks and balances, second insert data to our timeseries DB (will only care about book.depth and market.data type events)
    5. Matching engine's second event will be consumed by our backend (especially its WS layer), with which we'll send required events to our Frontend.

# [P1]
1. Integrate trading charts UI
