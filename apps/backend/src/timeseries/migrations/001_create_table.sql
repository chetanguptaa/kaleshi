CREATE TYPE order_side AS ENUM ('bid', 'ask');

CREATE TABLE order_book_depth (
  time        TIMESTAMPTZ NOT NULL,
  outcome_id  UUID NOT NULL,
  side        order_side NOT NULL,
  price       NUMERIC(18,8) NOT NULL,
  quantity    NUMERIC(18,8) NOT NULL
);

SELECT create_hypertable(
  'order_book_depth',
  'time',
  chunk_time_interval => INTERVAL '1 day'
);

CREATE INDEX ON order_book_depth (outcome_id, time DESC);
CREATE INDEX ON order_book_depth (outcome_id, side, price, time DESC);
