import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/queries";
import { backendFetch } from "@/lib/backendClient";
import { ProfileClient, ProfilePayload } from "./ProfileClient";

export default async function ProfilePage() {
  const user = await getSessionUser();
  if (!user) {
    redirect("/login?redirect=/profile");
  }
  const profile = await backendFetch<{ profile: ProfilePayload }>("/api/profile");
  return <ProfileClient initialProfile={profile.profile} />;
}
