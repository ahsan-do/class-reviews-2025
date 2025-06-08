// app/not-found.js
export const dynamic = 'force-dynamic';

export default function NotFound() {
    return (
        <div className="text-center py-10">
            <h1 className="text-2xl font-bold mb-4">404 - Page Not Found</h1>
            <p>The page you&apos;re looking for doesn&apos;t exist.</p>
        </div>
    );
}