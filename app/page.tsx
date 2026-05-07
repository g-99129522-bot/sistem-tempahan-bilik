"use client";

import { useState, useEffect } from 'react';
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  GraduationCap, Loader2, BookOpen, Settings, Lock, 
  Trash2, Edit3, Plus, Save, AlertTriangle, Code2, Heart, CheckCircle2, Clock
} from 'lucide-react';

const GOOGLE_SCRIPT_URL = "https://script.google.com/macros/s/AKfycby5j5IyS2E8blGQqXKLGB-xntMHl1_HUQUR7xs3Clo_nByuc9v6ZzDr7-J05Pi1aNt1/exec";

export default function BookingSystem() {
  const [mounted, setMounted] = useState(false);
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [bookings, setBookings] = useState<any[]>([]);
  const [rooms, setRooms] = useState<any[]>([]);
  const [purposes, setPurposes] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState(false);
  
  const [siteSettings, setSiteSettings] = useState({ 
    schoolName: "LOADING...", 
    systemName: "MEMUATKAN DATA", 
    logoUrl: "",
    logoId: "" 
  });

  const [showModal, setShowModal] = useState(false);
  const [showAdminLogin, setShowAdminLogin] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [passwordInput, setPasswordInput] = useState("");
  const [showAdminPanel, setShowAdminPanel] = useState(false);
  const [isEditingRoom, setIsEditingRoom] = useState<any>(null);
  const [newPurposeInput, setNewPurposeInput] = useState("");
  const [tempBooking, setTempBooking] = useState({ room: "", startTime: "", endTime: "", name: "", purposeType: "", purposeDetail: "" });

  const timeSlots = ["07:30", "08:00", "08:30", "09:00", "09:30", "10:00", "10:30", "11:00", "11:30", "12:00", "12:30", "13:00", "13:30", "14:00", "14:30"];

  useEffect(() => { setMounted(true); fetchData(); }, [date]);

  const fetchData = async () => {
    try {
      const res = await fetch(GOOGLE_SCRIPT_URL, { cache: 'no-store' });
      const result = await res.json();
      setBookings(result.bookings || []);
      setRooms(result.rooms || []);
      setPurposes(result.purposes || []);
      setSiteSettings(result.settings || siteSettings);
    } catch (e) { console.error("Sync Error"); }
  };

  const normalizeDate = (input: any) => {
    if (!input) return "";
    let d = new Date(input);
    return isNaN(d.getTime()) ? String(input) : d.toLocaleDateString('ms-MY', { day: 'numeric', month: 'long', year: 'numeric' });
  };

  const toMinutes = (t: string) => {
    if (!t) return 0;
    const parts = String(t).split(':');
    return parseInt(parts[0]) * 60 + parseInt(parts[1]);
  };

  const isTimePast = (slotTime: string) => {
    const today = new Date();
    const selectedDate = new Date(date || new Date());
    today.setHours(0, 0, 0, 0);
    selectedDate.setHours(0, 0, 0, 0);
    if (selectedDate.getTime() < today.getTime()) return true;
    if (selectedDate.getTime() === today.getTime()) {
      const now = new Date();
      return toMinutes(slotTime) < (now.getHours() * 60 + now.getMinutes());
    }
    return false;
  };

  const saveAdminAction = async (action: string, data: any) => {
    setLoading(true);
    try {
      await fetch(GOOGLE_SCRIPT_URL, { method: "POST", mode: "no-cors", body: JSON.stringify({ action, data }) });
      setTimeout(() => { fetchData(); setLoading(false); setIsEditingRoom(null); }, 1500);
    } catch (e) { setLoading(false); }
  };

  const handleBooking = async () => {
    if (!tempBooking.name || !tempBooking.endTime || !tempBooking.purposeType) return alert("Lengkapkan data!");
    setLoading(true);
    const payload = { ...tempBooking, room_name: tempBooking.room, user_name: tempBooking.name, booking_date: normalizeDate(date), start_time: tempBooking.startTime, end_time: tempBooking.endTime, purpose_type: tempBooking.purposeType, purpose_detail: tempBooking.purposeDetail || "-" };
    try {
      await fetch(GOOGLE_SCRIPT_URL, { method: "POST", mode: "no-cors", body: JSON.stringify({ action: "addBooking", data: payload }) });
      setTimeout(() => { 
        fetchData(); 
        setLoading(false);
        setShowModal(false);
        setBookingSuccess(true);
      }, 2000);
    } catch (e) { setLoading(false); }
  };

  // Fungsi pembantu untuk tukar kod Tailwind Google Sheet ke CSS Warna
  const getHeaderStyle = (colorStr: string) => {
    if (!colorStr) return { backgroundColor: '#2563eb' };
    if (colorStr.startsWith('bg-')) {
        const color = colorStr.split('-')[1]; // red, blue, etc
        return { backgroundColor: color };
    }
    if (colorStr.includes('from-') && colorStr.includes('to-')) {
        const parts = colorStr.split(' ');
        const from = parts[0].replace('from-', '').replace('-600', '').replace('-500', '');
        const to = parts[1].replace('to-', '').replace('-700', '').replace('-600', '');
        return { background: `linear-gradient(to bottom right, ${from}, ${to})` };
    }
    return { backgroundColor: '#2563eb' };
  };

  if (!mounted) return null;

  return (
    <TooltipProvider delayDuration={0}>
      <div className="min-h-screen bg-[#F8FAFC] font-sans pb-10">
        <header className="sticky top-0 z-40 w-full bg-white/80 backdrop-blur-md border-b px-6 py-3 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 flex items-center justify-center overflow-hidden rounded-xl">
              {siteSettings.logoUrl ? (
                <img src={siteSettings.logoUrl} alt="Logo" className="h-full w-full object-contain" />
              ) : (
                <div className="bg-blue-600 p-2 text-white shadow-lg"><GraduationCap size={24} /></div>
              )}
            </div>
            <div className="flex flex-col">
              <h1 className="text-sm md:text-base font-black uppercase tracking-tight text-slate-800 leading-none mb-1">{siteSettings.schoolName}</h1>
              <p className="text-[10px] md:text-xs font-bold uppercase tracking-widest text-blue-600 leading-none">{siteSettings.systemName}</p>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={() => isAdmin ? setShowAdminPanel(true) : setShowAdminLogin(true)} className="rounded-full">
            <Settings size={20} className="text-slate-500" />
          </Button>
        </header>

        <div className="max-w-7xl mx-auto p-6 md:p-8 flex flex-col lg:flex-row gap-8">
          <aside className="w-full lg:w-[320px] shrink-0 space-y-6">
            <Card className="rounded-[28px] p-5 border-none shadow-sm bg-white sticky top-24">
              <div className="mb-4 text-center">
                <p className="text-[10px] font-black text-blue-600 uppercase mb-2 tracking-widest">Pilih Tarikh</p>
                <div className="bg-slate-50 py-2 rounded-xl border border-slate-100 font-black text-sm text-slate-700 uppercase">{normalizeDate(date)}</div>
              </div>
              <Calendar mode="single" selected={date} onSelect={setDate} className="p-0 flex justify-center border-none" />
              <div className="mt-8 pt-6 border-t border-slate-100 flex flex-col items-start">
                <div className="flex items-center gap-2 mb-2">
                  <Code2 size={12} className="text-blue-500" />
                  <p className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400">Developer</p>
                </div>
                <p className="text-[11px] font-black text-slate-700 uppercase tracking-tight mb-1">CIKGU JEYA</p>
                <div className="flex items-center gap-1.5">
                  <Heart size={10} className="text-red-400 fill-red-400" />
                  <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">v2.0 • 2026</p>
                </div>
              </div>
            </Card>
          </aside>

          <main className="flex-grow grid grid-cols-1 md:grid-cols-2 gap-6">
            {rooms.filter(r => r.status !== "Hidden").map(room => (
              <Card key={room.id} className="rounded-[32px] border-none shadow-sm overflow-hidden bg-white transition-all hover:shadow-md">
                {/* PAKSA WARNA GUNA INLINE STYLE BERDASARKAN GOOGLE SHEET */}
                <div 
                    className="p-5 text-white flex justify-between items-center"
                    style={getHeaderStyle(room.color)}
                >
                  <div className="flex items-center gap-4">
                    <div className="bg-white/20 p-3 rounded-2xl backdrop-blur-sm text-2xl">{room.icon}</div>
                    <CardTitle className="text-xs font-black uppercase tracking-widest leading-none">{room.name}</CardTitle>
                  </div>
                  <Badge variant="outline" className="text-[9px] border-white/30 text-white font-bold px-3 py-1 rounded-full uppercase">{room.capacity} Pax</Badge>
                </div>
                <CardContent className="p-6 grid grid-cols-3 sm:grid-cols-5 gap-2">
                  {timeSlots.map(time => {
                    const bookingDetail = bookings.find(b => {
                        const matchRoom = String(b.room_name).trim() === String(room.name).trim();
                        const matchDate = String(b.booking_date).trim() === normalizeDate(date);
                        const slotMin = toMinutes(time);
                        const startMin = toMinutes(b.start_time);
                        const endMin = toMinutes(b.end_time);
                        return matchRoom && matchDate && slotMin >= startMin && slotMin < endMin;
                    });
                    const isPast = isTimePast(time);
                    const isBooked = !!bookingDetail;
                    return (
                      <Tooltip key={time}>
                        <TooltipTrigger asChild>
                          <div className="w-full">
                            <Button disabled={isBooked || isPast} className={`h-11 w-full rounded-xl text-[10px] font-black transition-all ${isBooked ? "bg-red-500 text-white opacity-100 shadow-lg" : isPast ? "bg-slate-100 text-slate-400 cursor-not-allowed" : "bg-slate-50 text-slate-500 hover:bg-blue-600 hover:text-white"}`} onClick={() => { if(!isBooked && !isPast) { setTempBooking({ ...tempBooking, room: room.name, startTime: time, name: "", purposeType: "", purposeDetail: "" }); setShowModal(true); } }}>{time}</Button>
                          </div>
                        </TooltipTrigger>
                        {isBooked && (
                          <TooltipContent side="top" className="bg-slate-900 text-white p-4 rounded-2xl shadow-2xl z-[100] max-w-[200px]">
                            <div className="space-y-2">
                              <p className="font-black text-[11px] text-blue-400 uppercase leading-none border-b border-white/10 pb-1">{bookingDetail.user_name}</p>
                              <p className="text-[10px] font-bold flex items-center gap-1 text-white opacity-90"><BookOpen size={12}/> {bookingDetail.purpose_type}</p>
                            </div>
                          </TooltipContent>
                        )}
                      </Tooltip>
                    );
                  })}
                </CardContent>
              </Card>
            ))}
          </main>
        </div>

        <Dialog open={showModal} onOpenChange={setShowModal}>
          <DialogContent className="rounded-[40px] max-w-[400px] p-8 border-none shadow-2xl">
            <DialogHeader>
              <DialogTitle className="text-xl font-black uppercase text-slate-800 flex items-center gap-2">
                <Plus className="text-blue-600" size={24}/> {tempBooking.room}
              </DialogTitle>
              <DialogDescription className="text-[10px] font-black text-blue-600 bg-blue-50 w-fit px-4 py-1 rounded-full uppercase">
                {normalizeDate(date)}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-5 mt-8">
              <div className="space-y-1.5">
                <Label className="text-[10px] font-black uppercase text-slate-400 ml-1">Nama Pemohon</Label>
                <Input defaultValue={tempBooking.name} onBlur={e => setTempBooking({...tempBooking, name: e.target.value})} className="rounded-2xl h-12 bg-slate-50 border-none font-black" placeholder="Nama Guru" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-black uppercase text-slate-400 ml-1 flex items-center gap-1"><Clock size={10}/> Masa Mula</Label>
                  <div className="h-12 rounded-2xl bg-slate-100 flex items-center px-4 font-black text-slate-500 text-sm border-2 border-dashed border-slate-200">{tempBooking.startTime}</div>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-black uppercase text-blue-600 ml-1 flex items-center gap-1"><Clock size={10}/> Masa Tamat</Label>
                  <select className="w-full h-12 rounded-2xl bg-white border-2 border-blue-100 text-[11px] font-black px-3 outline-none" value={tempBooking.endTime} onChange={e => setTempBooking({...tempBooking, endTime: e.target.value})}>
                    <option value="">PILIH</option>
                    {timeSlots.filter(t => toMinutes(t) > toMinutes(tempBooking.startTime)).map(t => <option key={t} value={t}>{t}</option>)}
                    <option value="15:00">15:00</option><option value="15:30">15:30</option><option value="16:00">16:00</option>
                  </select>
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-[10px] font-black uppercase text-slate-400 ml-1">Tujuan</Label>
                <select className="w-full h-12 rounded-2xl bg-slate-50 text-[11px] font-black px-3 outline-none" value={tempBooking.purposeType} onChange={e => setTempBooking({...tempBooking, purposeType: e.target.value})}>
                  <option value="">PILIH TUJUAN</option>
                  {purposes.map(p => <option key={p} value={p}>{p.toUpperCase()}</option>)}
                </select>
              </div>
              <Button onClick={handleBooking} disabled={loading} className="w-full h-14 rounded-[20px] bg-blue-600 font-black uppercase text-xs tracking-widest shadow-xl">
                {loading ? <Loader2 className="animate-spin" /> : "Sahkan Tempahan"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        <Dialog open={bookingSuccess} onOpenChange={setBookingSuccess}>
          <DialogContent className="rounded-[40px] max-w-[320px] p-8 text-center border-none shadow-2xl">
            <div className="flex flex-col items-center py-4">
              <div className="bg-emerald-100 p-4 rounded-full mb-4 animate-bounce"><CheckCircle2 size={48} className="text-emerald-600" /></div>
              <h3 className="text-xl font-black uppercase text-slate-800 mb-2">Berjaya!</h3>
              <Button onClick={() => setBookingSuccess(false)} className="mt-8 w-full bg-slate-900 rounded-2xl h-12 font-black uppercase text-[10px]">Tutup</Button>
            </div>
          </DialogContent>
        </Dialog>

        <Dialog open={showAdminLogin} onOpenChange={setShowAdminLogin}>
          <DialogContent className="rounded-[40px] max-w-[320px] p-10 text-center border-none shadow-2xl">
            <DialogTitle className="text-2xl font-black uppercase tracking-tighter">ADMIN LOGIN</DialogTitle>
            <div className="mt-6 space-y-4">
              <Input type="password" value={passwordInput} onChange={e => setPasswordInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && (passwordInput === "admin123" ? (setIsAdmin(true), setShowAdminLogin(false), setShowAdminPanel(true), setPasswordInput("")) : alert("Salah!"))} className="text-center font-black h-14 bg-slate-50 border-none rounded-2xl text-lg tracking-[0.4em]" placeholder="••••" />
              <Button onClick={() => passwordInput === "admin123" ? (setIsAdmin(true), setShowAdminLogin(false), setShowAdminPanel(true), setPasswordInput("")) : alert("Salah!")} className="w-full h-14 rounded-2xl bg-slate-900 font-black uppercase text-[10px] tracking-widest shadow-xl">Masuk</Button>
            </div>
          </DialogContent>
        </Dialog>

        <Dialog open={showAdminPanel} onOpenChange={setShowAdminPanel}>
          <DialogContent className="max-w-4xl h-[85vh] flex flex-col p-0 rounded-[40px] overflow-hidden border-none shadow-2xl">
            <div className="p-8 bg-slate-900 text-white shrink-0 font-black uppercase tracking-tighter flex items-center gap-3 text-2xl"><Settings size={28} className="text-blue-500"/> KONFIGURASI ADMIN</div>
            <Tabs defaultValue="rooms" className="flex-grow flex flex-col overflow-hidden">
              <TabsList className="mx-8 mt-6 bg-slate-100 p-1.5 rounded-2xl w-fit border border-slate-200">
                <TabsTrigger value="rooms" className="text-[10px] font-black uppercase px-6">Bilik</TabsTrigger>
                <TabsTrigger value="purposes" className="text-[10px] font-black uppercase px-6">Tujuan</TabsTrigger>
                <TabsTrigger value="data" className="text-[10px] font-black uppercase px-6 text-red-600">Rekod</TabsTrigger>
              </TabsList>
              <TabsContent value="rooms" className="flex-grow overflow-y-auto p-8 pt-4">
                <Button onClick={() => setIsEditingRoom({ name: "", icon: "🏢", capacity: "30", color: "from-blue-600 to-blue-700", status: "Active" })} className="mb-6 bg-blue-600 text-[10px] font-black uppercase rounded-xl px-6 h-11 shadow-lg">+ Tambah Bilik</Button>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {rooms.map((r, i) => (
                    <div key={i} className="flex items-center justify-between p-5 bg-slate-50 rounded-[24px] border border-slate-100">
                      <div className="flex items-center gap-4"><span className="text-3xl">{r.icon}</span><p className="font-black text-xs uppercase text-slate-700">{r.name}</p></div>
                      <div className="flex gap-1">
                        <Button variant="ghost" onClick={() => setIsEditingRoom(r)} className="text-blue-500 rounded-xl"><Edit3 size={18}/></Button>
                        <Button variant="ghost" onClick={() => { if(confirm('Padam?')) saveAdminAction("deleteRoom", r) }} className="text-red-400 rounded-xl"><Trash2 size={18}/></Button>
                      </div>
                    </div>
                  ))}
                </div>
              </TabsContent>
              <TabsContent value="purposes" className="p-8"><div className="space-y-4">{purposes.map((p, i) => (<div key={i} className="p-4 bg-slate-50 rounded-2xl flex justify-between uppercase font-black text-xs">{p}<Button variant="ghost" onClick={() => saveAdminAction("updatePurposes", purposes.filter((_, idx) => idx !== i))} className="text-red-400"><Trash2 size={18}/></Button></div>))}</div></TabsContent>
              <TabsContent value="data" className="p-8 h-full overflow-y-auto">
                <div className="space-y-3">{bookings.slice(0).reverse().map((b, i) => (<div key={i} className="p-4 bg-white rounded-[24px] border border-slate-100 flex justify-between items-center shadow-sm"><div><p className="font-black text-[11px] text-blue-600 uppercase leading-none">{b.user_name}</p><p className="text-[10px] text-slate-400 font-bold uppercase mt-2">{b.room_name} | {b.booking_date}</p></div><Button variant="ghost" onClick={() => saveAdminAction("deleteBooking", { row_index: b.row_index })} className="text-red-400 rounded-xl h-12 w-12"><Trash2 size={20}/></Button></div>))}</div>
              </TabsContent>
            </Tabs>
          </DialogContent>
        </Dialog>
      </div>
    </TooltipProvider>
  );
}
