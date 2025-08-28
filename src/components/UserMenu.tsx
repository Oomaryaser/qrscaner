import SignOutButton from "./SignOutButton";
import { getCurrentUser } from "@/lib/user";

export default async function UserMenu() {
  const user = await getCurrentUser();
  if (!user) return null;
  return (
    <div className="flex items-center gap-3">
      <div className="text-sm text-gray-600">
        {user.role === "owner" ? "المالك" : "المشرف"}: {user.username}
      </div>
      <SignOutButton />
    </div>
  );
}
