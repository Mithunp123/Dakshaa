import { useState } from "react";
import { motion } from "framer-motion";
import { FaUser, FaEnvelope, FaStar, FaCommentAlt } from "react-icons/fa";
import { Send, CheckCircle } from "lucide-react";
import { submitFeedback } from "../../services/feedbackService";

const Feedback = () => {
  const [formData, setFormData] = useState({
    username: "",
    email_id: "",
    rating: 5,
    message: "",
  });

  const [status, setStatus] = useState({
    submitting: false,
    submitted: false,
    error: null,
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleRatingChange = (rating) => {
    setFormData({
      ...formData,
      rating,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus({ submitting: true, submitted: false, error: null });

    try {
      const result = await submitFeedback(formData);

      if (result.success) {
        setStatus({ submitting: false, submitted: true, error: null });
        setFormData({
          username: "",
          email_id: "",
          rating: 5,
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
                <label className="block text-sm font-medium text-gray-400 mb-4">Rating</label>
                <div className="flex gap-4">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => handleRatingChange(star)}
                      className="focus:outline-none transition-transform hover:scale-110"
                    >
                      <FaStar
                        className={`text-3xl ${
                          star <= formData.rating ? "text-yellow-400" : "text-gray-600"
                        }`}
                      />
                    </button>
                  ))}
                </div>
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
                    placeholder="Tell us what you think..."
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
