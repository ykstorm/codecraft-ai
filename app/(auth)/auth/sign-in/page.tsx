import Image from 'next/image'
import React from 'react'

import SignInForm from '@/components/auth/sign-in-form'

export const dynamic = 'force-dynamic'

const Page = () => {
  return (
    <>
    <Image src={"/login.svg"} alt='Login-Image' height={300}  width={300} className='m-6 object-cover'/>
    <SignInForm/>
    </>
  )
}

export default Page