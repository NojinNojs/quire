import { AuthForm } from "./features/auth/AuthForm";
import { SearchScreen } from "./features/catalog/SearchScreen";
import { ErrorPanel } from "./features/states/ErrorPanel";
import { SkeletonRows } from "./features/states/SkeletonRows";
import { useSession } from "./lib/useSession";

export default function App() {
  const { user, ready, client, signOut, error, retry } = useSession();

  if (!client) {
    return (
      <main className="shell">
        <h1>Quire</h1>
        <p className="muted">
          Supabase is not configured. Copy <code>.env.example</code> to <code>.env</code> and fill
          in the project URL and anon key.
        </p>
      </main>
    );
  }

  if (!ready) {
    return (
      <main className="shell">
        <SkeletonRows label="Opening your account" />
      </main>
    );
  }

  if (error)
    return (
      <main className="shell">
        <h1>Quire</h1>
        <ErrorPanel messages={[error]} retry={retry} />
      </main>
    );

  if (!user) return <AuthForm client={client} />;

  return <SearchScreen key={user.id} user={user} client={client} signOut={signOut} />;
}
