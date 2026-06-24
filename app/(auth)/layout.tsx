import Image from 'next/image'
import Link from 'next/link'

export const runtime = 'nodejs'

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4">
      <div className="mb-8 w-full max-w-md text-center">
        <Link href="/" className="inline-flex">
          <Image
            src="/Koolerr_Logo_Transparent.png"
            alt="Koolerr"
            width={4096}
            height={2730}
            className="h-12 w-auto"
            priority
          />
        </Link>
      </div>
      <div className="w-full max-w-md">{children}</div>
    </div>
  )
}
