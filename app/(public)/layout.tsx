import PublicHeader from '@/shared/components/public-header'
import PublicFooter from '@/shared/components/public-footer'

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <PublicHeader />
      <main>{children}</main>
      <PublicFooter />
    </>
  )
}
