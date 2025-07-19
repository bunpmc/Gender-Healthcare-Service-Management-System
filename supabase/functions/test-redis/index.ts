import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { connect } from "https://deno.land/x/redis@v0.29.4/mod.ts";

serve(async () => {
  try {
    const redis = await connect({
      hostname: "redis-16115.c232.us-east-1-2.ec2.redns.redis-cloud.com",
      port: 16115,
      password: "TTscija9E5nQS9xCyypEjeA2xfhdibSE",
    });

    // Set + Get test
    await redis.set("test-key", "hello from Redis 👋");
    const result = await redis.get("test-key");

    return new Response(`Redis OK: ${result}`, { status: 200 });
  } catch (err) {
    return new Response(`Redis ERROR: ${err.message}`, { status: 500 });
  }
});