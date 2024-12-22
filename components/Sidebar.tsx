'use client'

import { sidebarLinks } from '@/constants'
import { cn } from '@/lib/utils'
import Image from 'next/image'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import Footer from './Footer'
import PlaidLink from './PlaidLink'
import { useTTS } from './TextToSpeech'
import TextToSpeech from './TextToSpeech'

const Sidebar = ({ user }: SiderbarProps) => {
  const pathname = usePathname();
  const { isEnabled, toggleTTS } = useTTS();

  return (
    
    <section className="sidebar">
      <nav className="flex flex-col gap-4">
        <Link href="/" className="mb-12 cursor-pointer flex items-center gap-2">
          <Image 
            src="/icons/logo.svg"
            width={34}
            height={34}
            alt="Horizon logo"
            className="size-[24px] max-xl:size-14"
          />
          <h1 className="sidebar-logo">DivyaPay</h1>
        </Link>

        {sidebarLinks.map((item) => {
          const isActive = pathname === item.route || pathname.startsWith(`${item.route}/`)

          return (
            <TextToSpeech>
            <Link href={item.route} key={item.label}
              className={cn('sidebar-link', { 'bg-bank-gradient': isActive })}
            >
              <div className="relative size-6">
                <Image 
                  src={item.imgURL}
                  alt={item.label}
                  fill
                  className={cn({
                    'brightness-[3] invert-0': isActive
                  })}
                />
              </div>
              <p className={cn("sidebar-label", { "!text-white": isActive })}>
                {item.label}
              </p>
            </Link>
            </TextToSpeech>
          )
        })}
        
        <PlaidLink user={user} />

        {/* Text-to-Speech Toggle */}
        <div className="flex items-center justify-between px-4 py-2 mt-4">
          <span className="text-sm text-gray-700">Text to Speech</span>
          <button
            onClick={toggleTTS}
            className={cn(
              "relative w-11 h-6 rounded-full transition-colors duration-200 ease-in-out",
              isEnabled ? "bg-blue-600" : "bg-gray-200"
            )}
            aria-label="Toggle text to speech"
          >
            <span
              className={cn(
                "absolute top-[2px] left-[2px] w-5 h-5 rounded-full bg-white transition-transform duration-200 ease-in-out",
                isEnabled ? "translate-x-5" : "translate-x-0"
              )}
            />
          </button>
        </div>
      </nav>

      <Footer user={user} />
    </section>
  )
}

export default Sidebar