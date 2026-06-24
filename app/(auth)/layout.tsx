import Image from 'next/image'
import Link from 'next/link'

export const runtime = 'nodejs'

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4">
      <div className="mb-6 w-full max-w-md text-center">
        <Link href="/" className="inline-flex">
          <Image
            src="/Koolerr_Logo_Wordmark.png"
            alt="Koolerr"
            width={3840}
            height={1274}
            className="h-16 w-auto"
            priority
          />
        </Link>
      </div>
      <div className="w-full max-w-md">{children}</div>
    </div>
  )
}
