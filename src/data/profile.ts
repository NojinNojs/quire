import type { BooksClient } from "./books";

export type ReaderProfile = {
  id: string;
  display_name: string | null;
  annual_goal: number | null;
};
const columns = "id,display_name,annual_goal";

export async function loadProfile(
  client: BooksClient,
  owner: string,
): Promise<ReaderProfile | null> {
  try {
    const { data, error } = await client
      .from("profiles")
      .select(columns)
      .eq("id", owner)
      .maybeSingle();
    if (error) throw error;
    return data as ReaderProfile | null;
  } catch {
    throw new Error("Could not load your profile. Try again.");
  }
}

export async function saveProfile(
  client: BooksClient,
  owner: string,
  patch: Pick<ReaderProfile, "display_name" | "annual_goal">,
): Promise<ReaderProfile> {
  const name = patch.display_name?.trim() || null;
  const goal = patch.annual_goal;
  if (goal !== null && (!Number.isInteger(goal) || goal < 1 || goal > 500)) {
    throw new Error("Annual goal must be a whole number from 1 to 500, or blank.");
  }
  try {
    const { data, error } = await client
      .from("profiles")
      .upsert({ id: owner, display_name: name, annual_goal: goal }, { onConflict: "id" })
      .eq("id", owner)
      .select(columns)
      .single();
    if (error || !data) throw error ?? new Error("Profile row missing");
    return data as ReaderProfile;
  } catch {
    throw new Error("Could not save your profile. Try again.");
  }
}
