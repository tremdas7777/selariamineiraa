
CREATE TABLE public.analytics_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  step TEXT NOT NULL,
  visitor_id TEXT NOT NULL,
  path TEXT NOT NULL,
  label TEXT,
  value NUMERIC,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_analytics_events_created_at ON public.analytics_events (created_at DESC);
CREATE INDEX idx_analytics_events_visitor ON public.analytics_events (visitor_id);
GRANT ALL ON public.analytics_events TO service_role;
ALTER TABLE public.analytics_events ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.store_orders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  external_id TEXT NOT NULL,
  reference_id TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL CHECK (status IN ('PENDING','APPROVED','FAILED','REFUNDED')),
  method TEXT NOT NULL CHECK (method IN ('PIX','CREDIT_CARD')),
  amount INTEGER NOT NULL DEFAULT 0,
  customer_name TEXT NOT NULL DEFAULT '',
  customer_email TEXT NOT NULL DEFAULT '',
  customer_phone TEXT NOT NULL DEFAULT '',
  city TEXT NOT NULL DEFAULT '',
  uf TEXT NOT NULL DEFAULT '',
  items JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_store_orders_created_at ON public.store_orders (created_at DESC);
GRANT ALL ON public.store_orders TO service_role;
ALTER TABLE public.store_orders ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.store_leads (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  visitor_id TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL DEFAULT '',
  email TEXT NOT NULL DEFAULT '',
  phone TEXT NOT NULL DEFAULT '',
  city TEXT NOT NULL DEFAULT '',
  uf TEXT NOT NULL DEFAULT '',
  amount INTEGER NOT NULL DEFAULT 0,
  items JSONB NOT NULL DEFAULT '[]'::jsonb,
  converted BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_store_leads_created_at ON public.store_leads (created_at DESC);
GRANT ALL ON public.store_leads TO service_role;
ALTER TABLE public.store_leads ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.integration_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  provider TEXT NOT NULL,
  ok BOOLEAN NOT NULL DEFAULT false,
  message TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_integration_logs_created_at ON public.integration_logs (created_at DESC);
GRANT ALL ON public.integration_logs TO service_role;
ALTER TABLE public.integration_logs ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.admin_settings (
  id TEXT NOT NULL PRIMARY KEY DEFAULT 'default',
  utmify_enabled BOOLEAN NOT NULL DEFAULT false,
  utmify_token TEXT NOT NULL DEFAULT '',
  fb_pixel_enabled BOOLEAN NOT NULL DEFAULT false,
  fb_pixel_id TEXT NOT NULL DEFAULT '',
  fb_access_token TEXT NOT NULL DEFAULT '',
  fb_test_event_code TEXT NOT NULL DEFAULT '',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT ALL ON public.admin_settings TO service_role;
ALTER TABLE public.admin_settings ENABLE ROW LEVEL SECURITY;
INSERT INTO public.admin_settings (id) VALUES ('default');
