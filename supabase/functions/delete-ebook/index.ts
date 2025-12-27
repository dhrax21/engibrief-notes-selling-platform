import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

export default async (req: Request) => {
  if (req.method !== "POST") {
    return new Response("Method Not Allowed", { status: 405 });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_ANON_KEY")!,
    {
      global: {
        headers: {
          Authorization: req.headers.get("Authorization")!
        }
      }
    }
  );

  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return new Response("Unauthorized", { status: 401 });
  }

  // 🔒 admin check
  const admin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  const { data: profile } = await admin
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") {
    return new Response("Forbidden", { status: 403 });
  }

  const { ebookId } = await req.json();

  const { error } = await admin
    .from("ebooks")
    .update({ is_active: false })
    .eq("id", ebookId);

  if (error) {
    return new Response(error.message, { status: 500 });
  }

  return new Response(
    JSON.stringify({ success: true }),
    { status: 200 }
  );
};
