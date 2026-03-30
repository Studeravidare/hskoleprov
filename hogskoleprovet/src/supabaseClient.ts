import { createClient } from "@supabase/supabase-js";

// Skapar och exporterar en Supabase-klient med projektets URL och publika nyckel
const supabase = createClient(
  "https://cbrlsklfpkcehjcbkbnh.supabase.co",
  "sb_publishable_rm0QXxJPJ-6DYvAFptNAsg_0XRhxcia",
);

export default supabase;
