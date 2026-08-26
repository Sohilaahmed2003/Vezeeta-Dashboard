import "./globals.css";
import Sidebar from "@/components/Sidebar";
import { getDataset } from "@/lib/store";

// The store is a mutable JSON file on disk, so every request must be
// rendered fresh — without this, Next.js could statically cache the shell
// (and the "has data yet?" dot) at build time and never update it.
export const dynamic = "force-dynamic";

export const metadata = {
  title: "Vezeeta Analytics Dashboard",
  description: "Vezeeta analytics dashboard",
};

export default async function RootLayout({ children }) {
  const { rows } = await getDataset();

  return (
    <html lang="en">
      <body>
        <div className="app">
          <Sidebar hasData={rows.length > 0} />
          <main className="main">{children}</main>
        </div>
      </body>
    </html>
  );
}
