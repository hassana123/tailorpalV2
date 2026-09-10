'use client'
import { useEffect, useState } from 'react'
import { Bell, CheckCheck } from 'lucide-react'
import { useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'

type Notice = { id: string; title: string; body: string; created_at: string; read_at: string | null }
export function NotificationFeed() {
 const params=useParams<{shopId?:string}>();const shopId=params.shopId;const db=createClient();const[open,setOpen]=useState(false);const[items,setItems]=useState<Notice[]>([])
 const load=async()=>{if(!shopId)return;await db.rpc('refresh_shop_notifications',{p_shop_id:shopId});const{data,error}=await db.from('shop_notifications').select('id,title,body,created_at,read_at').eq('shop_id',shopId).order('created_at',{ascending:false}).limit(12);if(error){toast.error(`Notifications: ${error.message}`);return};setItems((data||[]) as Notice[])}
 useEffect(()=>{void load()},[shopId])
 const markAll=async()=>{if(!shopId)return;const{error}=await db.from('shop_notifications').update({read_at:new Date().toISOString()}).eq('shop_id',shopId).is('read_at',null);if(error){toast.error(error.message);return};void load()}
 if(!shopId)return null
 const unread=items.filter(item=>!item.read_at).length
 return <div className="relative"><button onClick={()=>{setOpen(!open);if(!open)void load()}} className="relative w-9 h-9 rounded-xl bg-brand-cream border border-brand-border flex items-center justify-center text-brand-stone hover:text-brand-ink hover:bg-white"><Bell size={15}/>{unread>0&&<span className="absolute -top-1 -right-1 min-w-4 h-4 px-1 rounded-full bg-brand-gold text-white text-[9px] font-bold grid place-items-center">{unread}</span>}</button>{open&&<div className="absolute right-0 top-11 z-50 w-[min(22rem,calc(100vw-2rem))] rounded-2xl border border-brand-border bg-white shadow-xl overflow-hidden"><div className="p-3 border-b flex items-center justify-between"><b className="text-sm text-brand-ink">Workshop reminders</b><button onClick={()=>void markAll()} className="text-[11px] text-brand-gold font-bold flex items-center gap-1"><CheckCheck size={13}/>Mark read</button></div><div className="max-h-96 overflow-y-auto">{items.length?items.map(item=><div key={item.id} className={`p-3 border-b last:border-0 ${item.read_at?'bg-white':'bg-brand-cream/50'}`}><p className="text-xs font-bold text-brand-ink">{item.title}</p><p className="text-xs text-brand-stone mt-1">{item.body}</p></div>):<p className="p-5 text-xs text-brand-stone text-center">No reminders right now.</p>}</div></div>}</div>
}
