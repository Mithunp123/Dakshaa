import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { FaUser, FaEnvelope, FaStar, FaCommentAlt } from "react-icons/fa";
import { Send, CheckCircle } from "lucide-react";
import { submitFeedback } from "../../services/feedbackService";
import { supabase } from "../../supabase";

const WORKSHOP_QUESTIONS = [
  "How would you rate the overall quality of the workshop?",
  "How would you rate the clarity of the resource person’s explanation?",
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
  const normalized = (category || "").toLowerCase();
  return normalized.includes("workshop") ? WORKSHOP_QUESTIONS : EVENT_QUESTIONS;
};

const normalizeCategory = (category) => (category || "").trim().toUpperCase();

const buildInitialRatings = (questions) =>
  questions.reduce((acc, _, index) => {
    acc[`q${index + 1}`] = 5;
    return acc;
  }, {});

const Feedback = () => {
  const initialQuestions = getQuestionSet("");
  const [formData, setFormData] = useState({
    username: "",
    email_id: "",
    event_category: "",
    event_id: "",
    question_ratings: buildInitialRatings(initialQuestions),
    message: "",
  });

  const [events, setEvents] = useState([]);
  const [eventsLoading, setEventsLoading] = useState(true);

  const [status, setStatus] = useState({
    submitting: false,
    submitted: false,
    error: null,
  });

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const { data, error } = await supabase
          .from("events")
          .select("id, name, category")
          .eq("is_active", true)
          .order("name", { ascending: true });

        if (error) throw error;
        setEvents(data || []);
      } catch (error) {
        console.error("Error loading events for feedback:", error);
        setStatus((prev) => ({
          ...prev,
          error: "Unable to load events. Please refresh and try again.",
        }));
      } finally {
        setEventsLoading(false);
      }
    };

    fetchEvents();
  }, []);

  const categories = useMemo(() => {
    const map = new Map();
    (events || []).forEach((event) => {
      const normalized = normalizeCategory(event.category);
      if (normalized && !map.has(normalized)) {
        map.set(normalized, normalized);
      }
    });
    return Array.from(map.values()).sort((a, b) => a.localeCompare(b));
  }, [events]);

  const categoryEvents = useMemo(
    () => events.filter((event) => normalizeCategory(event.category) === formData.event_category),
    [events, formData.event_category]
  );

  const questions = useMemo(() => getQuestionSet(formData.event_category), [formData.event_category]);

  useEffect(() => {
    setFormData((prev) => ({
      ...prev,
      question_ratings: buildInitialRatings(questions),
    }));
  }, [questions]);

  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name === "event_category") {
      const normalizedValue = normalizeCategory(value);
      const categoryQuestions = getQuestionSet(normalizedValue);
      setFormData((prev) => ({
        ...prev,
        event_category: normalizedValue,
        event_id: "",
        question_ratings: buildInitialRatings(categoryQuestions),
      }));
      return;
    }

    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleQuestionRatingChange = (questionKey, rating) => {
    setFormData((prev) => ({
      ...prev,
      question_ratings: {
        ...prev.question_ratings,
        [questionKey]: rating,
      },
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus({ submitting: true, submitted: false, error: null });

    try {
      if (!formData.event_category || !formData.event_id) {
        setStatus({
          submitting: false,
          submitted: false,
          error: "Please select event category and event.",
        });
        return;
      }

      const selectedEvent = categoryEvents.find((event) => event.id === formData.event_id);

      const result = await submitFeedback({
        ...formData,
        event_name: selectedEvent?.name || null,
      });

      if (result.success) {
        setStatus({ submitting: false, submitted: true, error: null });
        setFormData({
          username: "",
          email_id: "",
          event_category: "",
          event_id: "",
          question_ratings: buildInitialRatings(initialQuestions),
          message: "",
        });
        setTimeout(() => setStatus((prev) => ({ ...prev, submitted: false })), 5000);
      } else {
        setStatus({ submitting: false, submitted: false, error: result.error || "Failed to submit feedback" });
      }
    } catch (error) {
      console.error("Error submitting feedback:", error);
      setStatus({ submitting: false, submitted: false, error: "Network error. Please try again later." });
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 pt-24 pb-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h1 className="text-4xl md:text-5xl font-orbitron font-bold text-white mb-4">
            Share Your <span className="text-secondary">Feedback</span>
          </h1>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto">
            Your feedback helps us improve DaKshaa. Let us know about your experience!
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          className="bg-slate-900/50 border border-secondary/20 rounded-2xl p-8 backdrop-blur-sm shadow-2xl"
        >
          {status.submitted ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex flex-col items-center justify-center py-12 text-center"
            >
              <CheckCircle className="w-20 h-20 text-green-500 mb-6" />
              <h2 className="text-2xl font-bold text-white mb-2">Thank You!</h2>
              <p className="text-gray-400">Your feedback has been successfully submitted.</p>
              <button
                onClick={() => setStatus({ ...status, submitted: false })}
                className="mt-8 px-6 py-2 bg-secondary text-slate-950 font-bold rounded-lg hover:bg-secondary/80 transition-colors"
              >
                Submit Another
              </button>
            </motion.div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">Name</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <FaUser className="text-secondary/50" />
                    </div>
                    <input
                      type="text"
                      name="username"
                      required
                      value={formData.username}
                      onChange={handleChange}
                      className="block w-full pl-10 pr-3 py-3 bg-slate-800/50 border border-secondary/20 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-secondary/50 focus:border-transparent transition-all"
                      placeholder="Your Name"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">Email</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <FaEnvelope className="text-secondary/50" />
                    </div>
                    <input
                      type="email"
                      name="email_id"
                      required
                      value={formData.email_id}
                      onChange={handleChange}
                      className="block w-full pl-10 pr-3 py-3 bg-slate-800/50 border border-secondary/20 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-secondary/50 focus:border-transparent transition-all"
                      placeholder="your@email.com"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Event Category</label>
                <select
                  name="event_category"
                  required
                  value={formData.event_category}
                  onChange={handleChange}
                  className="block w-full px-3 py-3 bg-slate-800/50 border border-secondary/20 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-secondary/50 focus:border-transparent transition-all"
                  disabled={eventsLoading}
                >
                  <option value="" className="bg-slate-900 text-gray-300">Select category</option>
                  {categories.map((category) => (
                    <option key={category} value={category} className="bg-slate-900 text-white">
                      {category}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Event</label>
                <select
                  name="event_id"
                  required
                  value={formData.event_id}
                  onChange={handleChange}
                  className="block w-full px-3 py-3 bg-slate-800/50 border border-secondary/20 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-secondary/50 focus:border-transparent transition-all"
                  disabled={!formData.event_category || eventsLoading}
                >
                  <option value="" className="bg-slate-900 text-gray-300">Select event</option>
                  {categoryEvents.map((event) => (
                    <option key={event.id} value={event.id} className="bg-slate-900 text-white">
                      {event.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-5">
                <label className="block text-sm font-medium text-gray-400">Rate each question (out of 5)</label>
                {questions.map((question, index) => {
                  const questionKey = `q${index + 1}`;
                  const selectedRating = formData.question_ratings?.[questionKey] || 0;

                  return (
                    <div key={questionKey} className="p-4 rounded-xl border border-secondary/20 bg-slate-800/30">
                      <p className="text-sm text-gray-200 mb-3">{index + 1}. {question}</p>
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex gap-3">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <button
                              key={star}
                              type="button"
                              onClick={() => handleQuestionRatingChange(questionKey, star)}
                              className="focus:outline-none transition-transform hover:scale-110"
                              aria-label={`Rate ${star} out of 5`}
                            >
                              <FaStar
                                className={`text-2xl ${
                                  star <= selectedRating ? "text-yellow-400" : "text-gray-600"
                                }`}
                              />
                            </button>
                          ))}
                        </div>
                        <span className="text-sm text-secondary font-semibold">{selectedRating}/5</span>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Your Message</label>
                <div className="relative">
                  <div className="absolute top-3 left-3 pointer-events-none">
                    <FaCommentAlt className="text-secondary/50" />
                  </div>
                  <textarea
                    name="message"
                    required
                    rows="4"
                    value={formData.message}
                    onChange={handleChange}
                    className="block w-full pl-10 pr-3 py-3 bg-slate-800/50 border border-secondary/20 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-secondary/50 focus:border-transparent transition-all"
                    placeholder="Share your feedback..."
                  ></textarea>
                </div>
              </div>

              {status.error && (
                <p className="text-red-500 text-sm text-center">{status.error}</p>
              )}

              <button
                type="submit"
                disabled={status.submitting}
                className={`w-full flex items-center justify-center gap-2 py-4 bg-secondary text-slate-950 font-bold rounded-xl hover:bg-secondary/80 transition-all transform hover:scale-[1.02] active:scale-[0.98] ${
                  status.submitting ? "opacity-70 cursor-not-allowed" : ""
                }`}
              >
                {status.submitting ? (
                  "Submitting..."
                ) : (
                  <>
                    Submit Feedback <Send className="w-5 h-5" />
                  </>
                )}
              </button>
            </form>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default Feedback;
