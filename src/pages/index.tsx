import dynamic from 'next/dynamic'

// disable SSR just for this component
const CustomersTable = dynamic(
  () => import('@/components/customers-table/CustomersTable'),
  {
    ssr: false,
  }
)

const HomePage = () => {
  return (
    <div className="flex w-full relative">
      <CustomersTable />
    </div>
  )
}

export default HomePage
