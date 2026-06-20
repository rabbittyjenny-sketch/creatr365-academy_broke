1import React from 'react';
1import React, { useEffect } from 'react';
2import { CourseNavbar } from '@/components/CourseNavbar';
3import { SEOHead } from '@/components/SEOHead';
4import { Mail, Globe, MessageCircle } from 'lucide-react';
5

6const LINE_QR_URL = 'https://ik.imagekit.io/ideas365logo/L_926gxgxq_BW-1.png?updatedAt=1774500421226';
7

8const Contact: React.FC = () => {
9  /* Cinematic dark tone — matches the landing page. Cleanup on unmount
10     so the dark scope never leaks to the next route. */
11  useEffect(() => {
12    document.documentElement.classList.add('dark');
13    return () => document.documentElement.classList.remove('dark');
14  }, []);
15

16  return (
17    <>
18      <SEOHead title="ติดต่อสอบถาม - Creatr365" description="ติดต่อ Creatr365 Live Streamer Academy" />
19      <CourseNavbar />
20

14      <section className="pt-28 pb-16 px-4 bg-background min-h-screen">
21      <section className="page-shell pt-28 pb-16 px-4">
22        <div className="max-w-3xl mx-auto">
16          <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4" data-accent="blue">ติดต่อสอบถาม</h1>
17          <p className="text-muted-foreground text-lg mb-12" data-accent="blue">สนใจหลักสูตรหรือมีคำถาม? ติดต่อเราได้เลยค่ะ</p>
23          <h1 className="section-title mb-4" data-accent="blue">ติดต่อสอบถาม</h1>
24          <p className="section-subtitle mb-12" data-accent="blue">สนใจหลักสูตรหรือมีคำถาม? ติดต่อเราได้เลยค่ะ</p>
25

26          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
27            {/* LINE Official */}
21            <div className="card-water border border-border bg-card p-8 text-center" data-accent="green">
28            <div className="card-water surface-card p-8 text-center" data-accent="green">
29              <div className="w-12 h-12 rounded-xl bg-foreground/5 flex items-center justify-center mx-auto mb-4">
30                <MessageCircle className="w-6 h-6 text-foreground/70" />
31              </div>
32              <h2 className="text-xl font-bold mb-4 hover-shift" data-accent="green">LINE Official</h2>
6 unmodified lines
39            </div>
40

41            {/* Other contacts */}
42            <div className="space-y-6">
36              <div className="card-water border border-border bg-card p-6" data-accent="blue">
43              <div className="card-water surface-card p-6" data-accent="blue">
44                <div className="flex items-start gap-4">
45                  <div className="w-10 h-10 rounded-xl bg-foreground/5 flex items-center justify-center flex-shrink-0">
46                    <Mail className="w-5 h-5 text-foreground/70" />
47                  </div>
5 unmodified lines
53                  </div>
54                </div>
55              </div>
56

50              <div className="card-water border border-border bg-card p-6" data-accent="red">
57              <div className="card-water surface-card p-6" data-accent="red">
58                <div className="flex items-start gap-4">
59                  <div className="w-10 h-10 rounded-xl bg-foreground/5 flex items-center justify-center flex-shrink-0">
60                    <Globe className="w-5 h-5 text-foreground/70" />
61                  </div>
5 unmodified lines
67                  </div>
68                </div>
69              </div>
70

64              <div className="card-water border border-border bg-card p-6" data-accent="yellow">
71              <div className="warm-card p-6">
72                <span className="warm-badge block mb-3">Visit Us</span>
73                <p className="text-sm text-muted-foreground leading-relaxed">
74                  <strong className="text-foreground">Creatr365 Live Streamer Academy</strong><br />
75                  Bangkok, Thailand<br /><br />
76                  เปิดรับสมัครตลอดทั้งปี<br />
12 unmodified lines

