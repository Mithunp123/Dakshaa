import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  MessageSquare,
  Star,
  Search,
  Filter,
  ChevronDown,
  Loader2,
  RefreshCw,
  BarChart3,
  Users,
  TrendingUp,
  FileSpreadsheet,
  FileText,
  Eye,
  X,
  Download
} from 'lucide-react';
import { supabase } from '../../../supabase';
import { getFeedbackByEvent, getFeedbackStatsByEvent, getFeedbackByCategory } from '../../../services/feedbackService';
import { usePageAuth } from '../../../hooks/usePageAuth';
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import ksrctLogo from '../../../assets/ksrct.webp';
import dakshaaLogo from '../../../assets/logo.webp';

const WORKSHOP_QUESTIONS = [
  "How would you rate the overall quality of the workshop?",
  "How would you rate the clarity of the resource person's explanation?",
  "How would you rate the relevance of the workshop content?",
  "How would you rate the organization and coordination of the event?",
  "How would you rate the venue and overall arrangements?",
];

const EVENT_QUESTIONS = [
  "How would you rate the overall quality of the event?",
  "How would you rate the organization and coordination of the event?",
  "How would you rate the opportunities provided for interaction and discussion?",
  "How would you rate the usefulness for your academic/career growth?",
  "How would you rate the time management of the event?",
];

const getQuestionSet = (category) => {
  const normalized = (category || '').toLowerCase();
  return normalized.includes('workshop') ? WORKSHOP_QUESTIONS : EVENT_QUESTIONS;
};

const normalizeCategoryName = (category) => {
  if (!category) return '';
  // Convert to Title Case (capitalize first letter of each word)
  return category.toLowerCase().split(/[\s-]+/).map(word => 
    word.charAt(0).toUpperCase() + word.slice(1)
  ).join(' ');
};

const RatingStars = ({ rating, size = 'sm' }) => {
  const starSize = size === 'sm' ? 'w-4 h-4' : 'w-5 h-5';
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={`${starSize} ${star <= rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-600'}`}
        />
      ))}
      <span className="ml-1 text-sm text-gray-400">{rating}/5</span>
    </div>
  );
};

const StatCard = ({ icon: Icon, label, value, subValue, color = 'secondary' }) => {
  const colorClasses = {
    secondary: 'text-secondary border-secondary/20 bg-secondary/5',
    green: 'text-green-400 border-green-500/20 bg-green-500/5',
    blue: 'text-blue-400 border-blue-500/20 bg-blue-500/5',
    yellow: 'text-yellow-400 border-yellow-500/20 bg-yellow-500/5',
    purple: 'text-purple-400 border-purple-500/20 bg-purple-500/5',
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`p-4 rounded-xl border ${colorClasses[color]} backdrop-blur-sm`}
    >
      <div className="flex items-center gap-3">
        <Icon className="w-8 h-8" />
        <div>
          <p className="text-2xl font-bold text-white">{value}</p>
          <p className="text-xs text-gray-400">{label}</p>
          {subValue && <p className="text-xs text-gray-500 mt-0.5">{subValue}</p>}
        </div>
      </div>
    </motion.div>
  );
};

const FeedbackReport = ({ coordinatorEvents }) => {
  const { isLoading: authLoading } = usePageAuth('Feedback Report');

  const isCoordinator = Array.isArray(coordinatorEvents);

  // Event selection
  const [events, setEvents] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [availableCategories, setAvailableCategories] = useState([]);

  // Feedback data
  const [feedbackList, setFeedbackList] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [ratingFilter, setRatingFilter] = useState('all');

  // Detail modal
  const [selectedFeedback, setSelectedFeedback] = useState(null);

  // Category PDF download
  const [categoryDownloading, setCategoryDownloading] = useState(false);

  useEffect(() => {
    if (isCoordinator) {
      // For coordinators, use their assigned events directly
      const cats = new Map();
      coordinatorEvents.forEach(evt => {
        if (evt.category) {
          const lowerKey = evt.category.toLowerCase();
          if (!cats.has(lowerKey)) cats.set(lowerKey, normalizeCategoryName(evt.category));
        }
      });
      setAvailableCategories(Array.from(cats.values()).sort((a, b) => 
        a.toLowerCase().localeCompare(b.toLowerCase())
      ));
      setEvents(coordinatorEvents);
    } else {
      fetchCategories();
      fetchEvents();
    }
  }, []);

  useEffect(() => {
    if (!isCoordinator) {
      fetchEvents();
    } else {
      // Filter coordinator events by selected category
      if (selectedCategory === 'all') {
        setEvents(coordinatorEvents);
      } else {
        setEvents(coordinatorEvents.filter(e => e.category?.toLowerCase() === selectedCategory.toLowerCase()));
      }
    }
  }, [selectedCategory]);

  useEffect(() => {
    if (selectedEvent) {
      loadFeedbackData(selectedEvent.id);
    } else {
      setFeedbackList([]);
      setStats(null);
    }
  }, [selectedEvent]);

  const fetchCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('events')
        .select('category')
        .order('category');
      if (error) throw error;

      const categoryMap = new Map();
      data?.forEach(item => {
        if (item.category) {
          const lowerKey = item.category.toLowerCase();
          if (!categoryMap.has(lowerKey)) {
            categoryMap.set(lowerKey, normalizeCategoryName(item.category));
          }
        }
      });
      setAvailableCategories(Array.from(categoryMap.values()).sort((a, b) => 
        a.toLowerCase().localeCompare(b.toLowerCase())
      ));
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const fetchEvents = async () => {
    try {
      let query = supabase
        .from('events')
        .select('id, name, category')
        .order('name');

      if (selectedCategory !== 'all') {
        query = query.ilike('category', selectedCategory);
      }

      const { data, error } = await query;
      if (error) throw error;
      setEvents(data || []);
    } catch (error) {
      console.error('Error fetching events:', error);
    }
  };

  const loadFeedbackData = async (eventId) => {
    setLoading(true);
    try {
      const [feedbackRes, statsRes] = await Promise.all([
        getFeedbackByEvent(eventId),
        getFeedbackStatsByEvent(eventId),
      ]);

      if (feedbackRes.success) setFeedbackList(feedbackRes.data);
      if (statsRes.success) setStats(statsRes.data);
    } catch (error) {
      console.error('Error loading feedback data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Filtered feedback
  const filteredFeedback = useMemo(() => {
    let list = feedbackList;
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      list = list.filter(
        f =>
          f.username?.toLowerCase().includes(term) ||
          f.email_id?.toLowerCase().includes(term) ||
          f.message?.toLowerCase().includes(term)
      );
    }
    if (ratingFilter !== 'all') {
      list = list.filter(f => f.rating === Number(ratingFilter));
    }
    return list;
  }, [feedbackList, searchTerm, ratingFilter]);

  // Question labels
  const questions = selectedEvent ? getQuestionSet(selectedEvent.category) : EVENT_QUESTIONS;

  // ---- Export functions ----
  const exportToExcel = () => {
    if (!filteredFeedback.length) return;
    const rows = filteredFeedback.map(f => {
      const row = {
        Name: f.username,
        Email: f.email_id,
        'Overall Rating': f.rating,
        Message: f.message,
        'Submitted At': new Date(f.created_at).toLocaleString(),
      };
      questions.forEach((q, i) => {
        row[`Q${i + 1}: ${q}`] = f.question_ratings?.[`q${i + 1}`] ?? '-';
      });
      return row;
    });

    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Feedback');
    XLSX.writeFile(wb, `Feedback_${selectedEvent?.name || 'Report'}.xlsx`);
  };

  const exportToPDF = async () => {
    if (!filteredFeedback.length) return;
    const doc = new jsPDF({ orientation: 'landscape' });

    const ksrctLogoData = await loadImageAsBase64(ksrctLogo);
    const dakshaaLogoData = await loadImageAsBase64(dakshaaLogo);

    const startY = addPdfHeader(
      doc, ksrctLogoData, dakshaaLogoData,
      `Feedback Report - ${selectedEvent?.name || 'Event'}`,
      `Total Responses: ${filteredFeedback.length} | Average Rating: ${stats?.averageRating || '-'} | Generated: ${new Date().toLocaleDateString('en-IN')}`
    );

    const headers = ['Name', 'Email', 'Rating', 'Message', 'Submitted At'];
    questions.forEach((_, i) => headers.push(`Q${i + 1}`));

    const body = filteredFeedback.map(f => {
      const row = [
        f.username,
        f.email_id,
        f.rating,
        f.message?.substring(0, 60) + (f.message?.length > 60 ? '...' : ''),
        new Date(f.created_at).toLocaleDateString(),
      ];
      questions.forEach((_, i) => {
        row.push(f.question_ratings?.[`q${i + 1}`] ?? '-');
      });
      return row;
    });

    autoTable(doc, {
      startY,
      head: [headers],
      body,
      styles: { fontSize: 7 },
      headStyles: { fillColor: [30, 58, 138] },
    });

    doc.save(`Feedback_${selectedEvent?.name || 'Report'}.pdf`);
  };

  // ---- Overall category PDF download ----
  const loadImageAsBase64 = (url) => {
    return new Promise((resolve) => {
      const img = new Image();
      img.crossOrigin = 'Anonymous';
      img.onload = () => {
        const scale = 4;
        const canvas = document.createElement('canvas');
        canvas.width = img.width * scale;
        canvas.height = img.height * scale;
        const ctx = canvas.getContext('2d');
        ctx.imageSmoothingEnabled = false;
        ctx.scale(scale, scale);
        ctx.drawImage(img, 0, 0, img.width, img.height);
        resolve({
          data: canvas.toDataURL('image/png', 1.0),
          width: img.width,
          height: img.height
        });
      };
      img.onerror = () => resolve(null);
      img.src = url;
    });
  };

  const addPdfHeader = (doc, ksrctLogoData, dakshaaLogoData, title, subtitle) => {
    const pageWidth = doc.internal.pageSize.getWidth();
    const headerY = 22;

    if (ksrctLogoData) {
      const logoHeight = 35;
      const aspectRatio = ksrctLogoData.width / ksrctLogoData.height;
      const logoWidth = logoHeight * aspectRatio;
      doc.addImage(ksrctLogoData.data, 'PNG', 14, headerY - logoHeight / 2, logoWidth, logoHeight, undefined, 'NONE');
    }

    if (dakshaaLogoData) {
      const logoHeight = 30;
      const aspectRatio = dakshaaLogoData.width / dakshaaLogoData.height;
      const logoWidth = logoHeight * aspectRatio;
      doc.addImage(dakshaaLogoData.data, 'PNG', pageWidth - logoWidth - 14, headerY - logoHeight / 2, logoWidth, logoHeight, undefined, 'NONE');
    }

    doc.setFontSize(18);
    doc.setTextColor(26, 54, 93);
    doc.setFont('helvetica', 'bold');
    doc.text('K.S.Rangasamy College of Technology', pageWidth / 2, headerY - 4, { align: 'center' });
    doc.setFontSize(11);
    doc.setTextColor(230, 126, 34);
    doc.text('AUTONOMOUS | TIRUCHENGODE', pageWidth / 2, headerY + 2, { align: 'center' });
    doc.setFontSize(14);
    doc.setTextColor(197, 48, 48);
    doc.text(title, pageWidth / 2, headerY + 10, { align: 'center' });
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text(subtitle, pageWidth / 2, headerY + 17, { align: 'center' });

    return headerY + 24;
  };

  const exportCategoryPDF = async () => {
    if (!selectedCategory || selectedCategory === 'all') return;
    setCategoryDownloading(true);
    try {
      const res = await getFeedbackByCategory(selectedCategory);
      if (!res.success || res.data.length === 0) {
        setCategoryDownloading(false);
        return;
      }

      const allFeedback = res.data;
      const doc = new jsPDF({ orientation: 'landscape' });

      const ksrctLogoData = await loadImageAsBase64(ksrctLogo);
      const dakshaaLogoData = await loadImageAsBase64(dakshaaLogo);

      // Group feedback by event_name
      const byEvent = {};
      allFeedback.forEach(fb => {
        const key = fb.event_name || 'Unknown Event';
        if (!byEvent[key]) byEvent[key] = [];
        byEvent[key].push(fb);
      });

      const eventNames = Object.keys(byEvent).sort();
      const categoryQuestions = getQuestionSet(selectedCategory);

      // ---- Page 1: Summary ----
      const totalResponses = allFeedback.length;
      const avgRating = (allFeedback.reduce((s, f) => s + f.rating, 0) / totalResponses).toFixed(2);

      let startY = addPdfHeader(
        doc, ksrctLogoData, dakshaaLogoData,
        `${selectedCategory} - Overall Feedback Report`,
        `Total Events: ${eventNames.length} | Total Responses: ${totalResponses} | Avg Rating: ${avgRating} | Generated: ${new Date().toLocaleDateString('en-IN')}`
      );

      // Summary table: event-wise totals
      const summaryHeaders = ['S.No', 'Event Name', 'Responses', 'Avg Rating', '5★', '4★', '3★', '2★', '1★'];
      const summaryBody = eventNames.map((name, idx) => {
        const items = byEvent[name];
        const avg = (items.reduce((s, f) => s + f.rating, 0) / items.length).toFixed(2);
        return [
          idx + 1,
          name,
          items.length,
          avg,
          items.filter(f => f.rating === 5).length,
          items.filter(f => f.rating === 4).length,
          items.filter(f => f.rating === 3).length,
          items.filter(f => f.rating === 2).length,
          items.filter(f => f.rating === 1).length,
        ];
      });

      autoTable(doc, {
        startY,
        head: [summaryHeaders],
        body: summaryBody,
        styles: { fontSize: 8 },
        headStyles: { fillColor: [30, 58, 138] },
      });

      // ---- Per-event pages ----
      eventNames.forEach((eventName) => {
        doc.addPage('landscape');
        const items = byEvent[eventName];
        const eventAvg = (items.reduce((s, f) => s + f.rating, 0) / items.length).toFixed(2);

        const tableStartY = addPdfHeader(
          doc, ksrctLogoData, dakshaaLogoData,
          `Feedback Report - ${eventName}`,
          `Responses: ${items.length} | Avg Rating: ${eventAvg} | Category: ${selectedCategory}`
        );

        const headers = ['S.No', 'Name', 'Email', 'Rating', 'Message', 'Submitted'];
        categoryQuestions.forEach((_, i) => headers.push(`Q${i + 1}`));

        const body = items.map((f, idx) => {
          const row = [
            idx + 1,
            f.username,
            f.email_id,
            f.rating,
            f.message?.substring(0, 50) + (f.message?.length > 50 ? '...' : ''),
            new Date(f.created_at).toLocaleDateString('en-IN'),
          ];
          categoryQuestions.forEach((_, i) => {
            row.push(f.question_ratings?.[`q${i + 1}`] ?? '-');
          });
          return row;
        });

        autoTable(doc, {
          startY: tableStartY,
          head: [headers],
          body,
          styles: { fontSize: 7 },
          headStyles: { fillColor: [30, 58, 138] },
        });
      });

      doc.save(`Feedback_${selectedCategory}_Overall_Report.pdf`);
    } catch (error) {
      console.error('Error generating category PDF:', error);
    } finally {
      setCategoryDownloading(false);
    }
  };

  // ---- Rating distribution bar ----
  const RatingBar = ({ rating, count, total }) => {
    const pct = total > 0 ? (count / total) * 100 : 0;
    return (
      <div className="flex items-center gap-2 text-sm">
        <span className="w-4 text-gray-400">{rating}</span>
        <Star className="w-3.5 h-3.5 text-yellow-400 fill-yellow-400" />
        <div className="flex-1 h-2.5 bg-slate-700 rounded-full overflow-hidden">
          <div
            className="h-full bg-yellow-400 rounded-full transition-all duration-500"
            style={{ width: `${pct}%` }}
          />
        </div>
        <span className="w-8 text-right text-gray-400">{count}</span>
      </div>
    );
  };

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-secondary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <MessageSquare className="w-7 h-7 text-secondary" />
            Feedback Report
          </h1>
          <p className="text-gray-400 text-sm mt-1">View and analyse event feedback</p>
        </div>
        {selectedEvent && feedbackList.length > 0 && (
          <div className="flex gap-2">
            <button
              onClick={exportToExcel}
              className="flex items-center gap-1.5 px-3 py-2 bg-green-600/20 text-green-400 rounded-lg hover:bg-green-600/30 transition-colors text-sm"
            >
              <FileSpreadsheet className="w-4 h-4" /> Excel
            </button>
            <button
              onClick={exportToPDF}
              className="flex items-center gap-1.5 px-3 py-2 bg-red-600/20 text-red-400 rounded-lg hover:bg-red-600/30 transition-colors text-sm"
            >
              <FileText className="w-4 h-4" /> PDF
            </button>
          </div>
        )}
      </div>

      {/* Event Selector */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-400 mb-1.5">Category</label>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <select
                value={selectedCategory}
                onChange={(e) => {
                  setSelectedCategory(e.target.value);
                  setSelectedEvent(null);
                }}
                className="w-full px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-white appearance-none focus:outline-none focus:ring-2 focus:ring-secondary/50"
              >
                <option value="all">All Categories</option>
                {availableCategories.map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
              <ChevronDown className="w-4 h-4 text-gray-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
            {!isCoordinator && selectedCategory && selectedCategory !== 'all' && (
              <button
                onClick={exportCategoryPDF}
                disabled={categoryDownloading}
                className="flex items-center gap-1.5 px-3 py-2.5 bg-purple-600/20 text-purple-400 border border-purple-500/30 rounded-lg hover:bg-purple-600/30 transition-colors text-sm whitespace-nowrap disabled:opacity-50"
                title={`Download all ${selectedCategory} feedback as PDF`}
              >
                {categoryDownloading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                {categoryDownloading ? 'Generating…' : 'Overall PDF'}
              </button>
            )}
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-400 mb-1.5">Event</label>
          <div className="relative">
            <select
              value={selectedEvent?.id || ''}
              onChange={(e) => {
                const evt = events.find(ev => ev.id === e.target.value);
                setSelectedEvent(evt || null);
              }}
              className="w-full px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-white appearance-none focus:outline-none focus:ring-2 focus:ring-secondary/50"
            >
              <option value="">Select an event</option>
              {events.map((evt) => (
                <option key={evt.id} value={evt.id}>{evt.name}</option>
              ))}
            </select>
            <ChevronDown className="w-4 h-4 text-gray-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-8 h-8 animate-spin text-secondary" />
          <span className="ml-3 text-gray-400">Loading feedback…</span>
        </div>
      )}

      {/* No event selected */}
      {!selectedEvent && !loading && (
        <div className="text-center py-16 text-gray-500">
          <MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-40" />
          <p>Select an event to view feedback report</p>
        </div>
      )}

      {/* Stats & Data (when event selected and data loaded) */}
      {selectedEvent && !loading && (
        <>
          {/* Stats Cards */}
          {stats && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <StatCard icon={MessageSquare} label="Total Responses" value={stats.totalFeedback} color="secondary" />
              <StatCard
                icon={Star}
                label="Average Rating"
                value={stats.averageRating}
                subValue="out of 5"
                color="yellow"
              />
              <StatCard
                icon={TrendingUp}
                label="5-Star Reviews"
                value={stats.ratingDistribution?.[5] || 0}
                subValue={stats.totalFeedback > 0 ? `${((stats.ratingDistribution?.[5] || 0) / stats.totalFeedback * 100).toFixed(0)}%` : '0%'}
                color="green"
              />
              <StatCard
                icon={Users}
                label="Unique Respondents"
                value={new Set(feedbackList.map(f => f.email_id)).size}
                color="blue"
              />
            </div>
          )}

          {/* Rating Distribution + Question Averages */}
          {stats && stats.totalFeedback > 0 && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Rating Distribution */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-5 bg-slate-900/50 border border-slate-700/50 rounded-xl"
              >
                <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-secondary" /> Rating Distribution
                </h3>
                <div className="space-y-2.5">
                  {[5, 4, 3, 2, 1].map((r) => (
                    <RatingBar key={r} rating={r} count={stats.ratingDistribution?.[r] || 0} total={stats.totalFeedback} />
                  ))}
                </div>
              </motion.div>

              {/* Question-wise Averages */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="p-5 bg-slate-900/50 border border-slate-700/50 rounded-xl"
              >
                <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-secondary" /> Question-wise Averages
                </h3>
                <div className="space-y-3">
                  {questions.map((q, i) => {
                    const key = `q${i + 1}`;
                    const avg = stats.questionAverages?.[key] ?? '-';
                    const numAvg = Number(avg);
                    const pct = Number.isFinite(numAvg) ? (numAvg / 5) * 100 : 0;
                    return (
                      <div key={key}>
                        <p className="text-xs text-gray-400 mb-1 truncate" title={q}>
                          Q{i + 1}. {q}
                        </p>
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-2 bg-slate-700 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-secondary rounded-full transition-all duration-500"
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                          <span className="text-sm font-medium text-white w-10 text-right">{avg}/5</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </motion.div>
            </div>
          )}

          {/* Search & Filter bar */}
          {feedbackList.length > 0 && (
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search by name, email, or message…"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-secondary/50 text-sm"
                />
              </div>
              <div className="relative">
                <select
                  value={ratingFilter}
                  onChange={(e) => setRatingFilter(e.target.value)}
                  className="px-3 py-2 pr-8 bg-slate-800 border border-slate-700 rounded-lg text-white appearance-none focus:outline-none focus:ring-2 focus:ring-secondary/50 text-sm"
                >
                  <option value="all">All Ratings</option>
                  {[5, 4, 3, 2, 1].map((r) => (
                    <option key={r} value={r}>{r} Star{r > 1 ? 's' : ''}</option>
                  ))}
                </select>
                <Filter className="w-4 h-4 text-gray-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
              <button
                onClick={() => loadFeedbackData(selectedEvent.id)}
                className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 border border-slate-700 text-gray-300 rounded-lg hover:bg-slate-700 transition-colors text-sm"
              >
                <RefreshCw className="w-4 h-4" /> Refresh
              </button>
            </div>
          )}

          {/* Feedback Table */}
          {feedbackList.length === 0 && !loading ? (
            <div className="text-center py-12 text-gray-500">
              <MessageSquare className="w-10 h-10 mx-auto mb-2 opacity-40" />
              <p>No feedback submitted for this event yet</p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-slate-700/50">
              <table className="w-full text-sm text-left">
                <thead className="bg-slate-800/80 text-gray-400 uppercase text-xs">
                  <tr>
                    <th className="px-4 py-3">#</th>
                    <th className="px-4 py-3">Name</th>
                    <th className="px-4 py-3">Email</th>
                    <th className="px-4 py-3">Rating</th>
                    <th className="px-4 py-3">Message</th>
                    <th className="px-4 py-3">Submitted</th>
                    <th className="px-4 py-3 text-center">Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700/50">
                  {filteredFeedback.map((fb, idx) => (
                    <tr
                      key={fb.id}
                      className="hover:bg-slate-800/40 transition-colors"
                    >
                      <td className="px-4 py-3 text-gray-500">{idx + 1}</td>
                      <td className="px-4 py-3 text-white font-medium">{fb.username}</td>
                      <td className="px-4 py-3 text-gray-400">{fb.email_id}</td>
                      <td className="px-4 py-3">
                        <RatingStars rating={fb.rating} />
                      </td>
                      <td className="px-4 py-3 text-gray-300 max-w-[200px] truncate" title={fb.message}>
                        {fb.message}
                      </td>
                      <td className="px-4 py-3 text-gray-400 whitespace-nowrap">
                        {new Date(fb.created_at).toLocaleDateString('en-IN', {
                          day: '2-digit', month: 'short', year: 'numeric',
                          hour: '2-digit', minute: '2-digit'
                        })}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <button
                          onClick={() => setSelectedFeedback(fb)}
                          className="p-1.5 rounded-lg hover:bg-secondary/20 text-secondary transition-colors"
                          title="View details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {filteredFeedback.length === 0 && feedbackList.length > 0 && (
                <div className="text-center py-8 text-gray-500 text-sm">
                  No results match your filters
                </div>
              )}
            </div>
          )}

          {/* Result count */}
          {feedbackList.length > 0 && (
            <p className="text-xs text-gray-500 text-right">
              Showing {filteredFeedback.length} of {feedbackList.length} responses
            </p>
          )}
        </>
      )}

      {/* Feedback Detail Modal */}
      {selectedFeedback && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-lg max-h-[85vh] overflow-y-auto shadow-2xl"
          >
            <div className="flex items-center justify-between p-5 border-b border-slate-700">
              <h3 className="text-lg font-semibold text-white">Feedback Details</h3>
              <button
                onClick={() => setSelectedFeedback(null)}
                className="p-1.5 rounded-lg hover:bg-slate-800 text-gray-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-gray-500">Name</p>
                  <p className="text-white font-medium">{selectedFeedback.username}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Email</p>
                  <p className="text-gray-300 text-sm break-all">{selectedFeedback.email_id}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Event</p>
                  <p className="text-gray-300 text-sm">{selectedFeedback.event_name}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Category</p>
                  <p className="text-gray-300 text-sm">{selectedFeedback.event_category}</p>
                </div>
              </div>

              <div>
                <p className="text-xs text-gray-500 mb-1">Overall Rating</p>
                <RatingStars rating={selectedFeedback.rating} size="md" />
              </div>

              <div>
                <p className="text-xs text-gray-500 mb-2">Question-wise Ratings</p>
                <div className="space-y-2">
                  {questions.map((q, i) => {
                    const key = `q${i + 1}`;
                    const val = selectedFeedback.question_ratings?.[key];
                    return (
                      <div key={key} className="p-3 bg-slate-800/50 rounded-lg">
                        <p className="text-xs text-gray-400 mb-1">Q{i + 1}. {q}</p>
                        <RatingStars rating={val || 0} />
                      </div>
                    );
                  })}
                </div>
              </div>

              <div>
                <p className="text-xs text-gray-500 mb-1">Message</p>
                <p className="text-gray-300 text-sm bg-slate-800/50 p-3 rounded-lg whitespace-pre-wrap">
                  {selectedFeedback.message}
                </p>
              </div>

              <div className="text-xs text-gray-500">
                Submitted: {new Date(selectedFeedback.created_at).toLocaleString('en-IN')}
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default FeedbackReport;
