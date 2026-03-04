'use client'

import { Share2, MessageCircle, Twitter, Send, Instagram, Sparkles } from 'lucide-react'
import { ModalForm } from '@/components/dashboard/shared/ModalForm'
import { CopyButton } from '../shared/CopyButton'
import { InviteResultData } from '../../../app/dashboard/shop/[shopId]/staff/types'
import { toast } from 'sonner'

interface InviteResultModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  invite: InviteResultData | null
  buildStaffSignUpLink: (inviteCode: string) => string
  buildInviteInstructionsText: (inviteCode: string, inviteLink: string) => string
  onShare: () => Promise<void>
}

export function InviteResultModal({
  open,
  onOpenChange,
  invite,
  buildStaffSignUpLink,
  buildInviteInstructionsText,
  onShare,
}: InviteResultModalProps) {
  if (!invite) return null

  const handleInstagramCopy = async () => {
    const text = buildInviteInstructionsText(invite.inviteCode, invite.inviteLink)
    await navigator.clipboard.writeText(text)
    toast.success('Copied for Instagram')
  }

  return (
    <ModalForm
      open={open}
      onOpenChange={onOpenChange}
      title="Invitation Created"
      description="Share the signup flow and invite code with your staff member."
      hideFooter
      maxWidth="md"
    >
      <div className="space-y-4">
        {/* Signup link */}
        <div className="bg-brand-cream border border-brand-border rounded-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-[10px] font-bold text-brand-stone uppercase tracking-wider">Signup Link</p>
            <CopyButton value={buildStaffSignUpLink(invite.inviteCode)} label="Signup Link" />
          </div>
          <p className="text-xs text-brand-charcoal break-all font-mono leading-relaxed">
            {buildStaffSignUpLink(invite.inviteCode)}
          </p>
        </div>

        {/* Invite link */}
        <div className="bg-brand-cream border border-brand-border rounded-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-[10px] font-bold text-brand-stone uppercase tracking-wider">Invite Link</p>
            <CopyButton value={invite.inviteLink} label="Link" />
          </div>
          <p className="text-xs text-brand-charcoal break-all font-mono leading-relaxed">
            {invite.inviteLink}
          </p>
        </div>

        {/* Invite code */}
        <div className="bg-brand-cream border border-brand-border rounded-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-[10px] font-bold text-brand-stone uppercase tracking-wider">Invite Code</p>
            <CopyButton value={invite.inviteCode} label="Code" />
          </div>
          <p className="font-mono text-2xl font-bold text-brand-ink tracking-[0.3em]">
            {invite.inviteCode}
          </p>
        </div>

        {/* Share buttons */}
        <div className="flex flex-wrap gap-2">
          <button
            onClick={onShare}
            className="flex items-center gap-2 h-9 px-4 rounded-xl bg-brand-ink text-white text-xs font-semibold hover:bg-brand-charcoal transition-all"
          >
            <Share2 size={13} /> Share
          </button>
          {invite.shareLinks && (
            <>
              <a href={invite.shareLinks.whatsapp} target="_blank" rel="noreferrer">
                <button className="flex items-center gap-2 h-9 px-4 rounded-xl bg-[#25D366]/10 text-[#25D366] border border-[#25D366]/25 text-xs font-semibold hover:bg-[#25D366]/15 transition-all">
                  <MessageCircle size={13} /> WhatsApp
                </button>
              </a>
              <a href={invite.shareLinks.twitter} target="_blank" rel="noreferrer">
                <button className="flex items-center gap-2 h-9 px-4 rounded-xl bg-sky-50 text-sky-600 border border-sky-200 text-xs font-semibold hover:bg-sky-100 transition-all">
                  <Twitter size={13} /> Twitter
                </button>
              </a>
              <a href={invite.shareLinks.telegram} target="_blank" rel="noreferrer">
                <button className="flex items-center gap-2 h-9 px-4 rounded-xl bg-sky-50 text-sky-600 border border-sky-200 text-xs font-semibold hover:bg-sky-100 transition-all">
                  <Send size={13} /> Telegram
                </button>
              </a>
            </>
          )}
          <button
            onClick={handleInstagramCopy}
            className="flex items-center gap-2 h-9 px-4 rounded-xl bg-pink-50 text-pink-600 border border-pink-200 text-xs font-semibold hover:bg-pink-100 transition-all"
          >
            <Instagram size={13} /> Instagram
          </button>
        </div>

        <p className="text-[11px] text-brand-stone/60 flex items-center gap-1.5">
          <Sparkles size={10} className="text-brand-gold" />
          Staff flow: sign up, choose Staff role, then accept with invite code on onboarding.
        </p>
      </div>
    </ModalForm>
  )
}
