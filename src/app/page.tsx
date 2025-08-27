import { getUserIdFromCookies } from "@/lib/session";
import LoginForm from "@/components/LoginForm";
import CreateEventForm from "@/components/CreateEventForm";

export default async function Home() {
  const uid = await getUserIdFromCookies();
  return (
    <div className="space-y-8">
      {!uid ? (
        <>
          <h1 className="text-2xl font-semibold">تسجيل الدخول</h1>
          <LoginForm />
        </>
      ) : (
        <CreateEventForm />
      )}
    </div>
  );
}
