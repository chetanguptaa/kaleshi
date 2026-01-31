CREATE TYPE order_side AS ENUM ('bid', 'ask');

CREATE TABLE order_book_depth (
  time        TIMESTAMPTZ NOT NULL,
  outcome_id  UUID NOT NULL,
  side        order_side NOT NULL,
  price       NUMERIC(18,8) NOT NULL,
  quantity    NUMERIC(18,8) NOT NULL,
  is_empty    BOOLEAN DEFAULT false
);

CREATE TABLE market_data (
  time        TIMESTAMPTZ NOT NULL,
  market_id    NUMERIC(18,8) NOT NULL,
  outcome_id   UUID NOT NULL,
  fair_price   NUMERIC(18,8) NOT NULL,
  total_volume NUMERIC(18,8) NOT NULL
);

SELECT create_hypertable(
  'order_book_depth',
  'time',
  chunk_time_interval => INTERVAL '1 day'
);

SELECT create_hypertable(
  'market_data',
  'time',
  chunk_time_interval => INTERVAL '1 day'
);

CREATE INDEX ON order_book_depth (outcome_id, time DESC);
CREATE INDEX ON order_book_depth (outcome_id, side, price, time DESC);
CREATE INDEX ON market_data (market_id, time DESC);
CREATE INDEX ON market_data (market_id, outcome_id, time DESC);
