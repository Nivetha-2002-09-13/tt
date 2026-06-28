import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import toast from "react-hot-toast";
import { motion } from "framer-motion";

const Register: React.FC = () => {
  const [formData, setFormData] = useState({
    email: "", password: "", firstName: "", lastName: "",
    role: "PLAYER", phone: "",
    playerProfile: { gender: "", skillLevel: "Intermediate", clubAffiliation: "", dateOfBirth: "" },
  });
  const [profileImage, setProfileImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [paymentReceipt, setPaymentReceipt] = useState<File | null>(null);
  const [receiptName, setReceiptName] = useState<string | null>(null);
  const [ageCategory, setAgeCategory] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith("image/")) { toast.error("Please select an image"); return; }
      if (file.size > 5 * 1024 * 1024) { toast.error("Image too large (<5MB)"); return; }
      setProfileImage(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleReceiptChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith("image/") && file.type !== "application/pdf") { 
        toast.error("Please select an image or PDF"); return; 
      }
      if (file.size > 5 * 1024 * 1024) { toast.error("File too large (<5MB)"); return; }
      setPaymentReceipt(file);
      setReceiptName(file.name);
    }
  };

  const calculateAgeCategory = (dobString: string) => {
    setFormData({ ...formData, playerProfile: { ...formData.playerProfile, dateOfBirth: dobString } });
    if (!dobString) { setAgeCategory(""); return; }
    
    const dob = new Date(dobString);
    const today = new Date();
    let age = today.getFullYear() - dob.getFullYear();
    const m = today.getMonth() - dob.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) {
      age--;
    }
    setAgeCategory(age < 13 ? "Junior (Under 13)" : "Senior (13+)");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profileImage) { toast.error("Profile picture is required"); return; }
    if (formData.role === "PLAYER") {
      if (!formData.playerProfile.gender) { toast.error("Gender is required for players"); return; }
      if (!formData.playerProfile.dateOfBirth) { toast.error("Date of Birth is required"); return; }
      if (!paymentReceipt) { toast.error("Payment Receipt is required"); return; }
    }

    setIsLoading(true);
    try {
      // 1. Register User (JSON)
      const payload = { ...formData };
      if (payload.role !== "PLAYER") delete (payload as any).playerProfile;
      else payload.playerProfile.dateOfBirth = new Date(payload.playerProfile.dateOfBirth).toISOString();

      await register(payload);

      // 2. Upload Profile Image
      if (profileImage) {
        const fdImg = new FormData(); fdImg.append("profileImage", profileImage);
        await api.post("/users/upload-profile-image", fdImg, { headers: { "Content-Type": "multipart/form-data" } });
      }

      // 3. Upload Payment Receipt
      if (paymentReceipt && formData.role === "PLAYER") {
        const fdReceipt = new FormData(); fdReceipt.append("paymentReceipt", paymentReceipt);
        await api.post("/users/upload-payment-receipt", fdReceipt, { headers: { "Content-Type": "multipart/form-data" } });
      }

      toast.success("Account created! Please verify your email.");
      navigate("/login");
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Registration failed");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex text-white" style={{ background: "#061D23" }}>
      {/* ── Left Half: Form ── */}
      <div className="w-full lg:w-7/12 flex flex-col justify-center px-6 sm:px-12 py-12 relative z-10 bg-[#061D23] overflow-y-auto max-h-screen custom-scrollbar">
        <Link to="/" className="absolute top-8 left-6 sm:left-12 flex items-center gap-2 group">
          <div className="w-8 h-8 bg-gradient-to-br from-[#12679E] to-[#4AEEFF]/60 rounded-lg
                          flex items-center justify-center transform transition-all group-hover:scale-110">
            <span className="text-white text-sm">🏓</span>
          </div>
          <span className="font-black text-lg tracking-tight">TT<span className="text-[#4AEEFF]">MS</span></span>
        </Link>

        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          className="max-w-2xl w-full mx-auto mt-16 lg:mt-8"
        >
          <p className="text-[#4AEEFF] font-bold text-sm tracking-widest uppercase mb-2">Join the Platform</p>
          <h2 className="text-4xl font-black text-white mb-8">Create Account</h2>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Image Upload */}
            <div className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-[#12679E]/40 rounded-2xl bg-[#12679E]/5 hover:bg-[#12679E]/10 transition-colors">
              <input type="file" id="profileImage" accept="image/*" onChange={handleImageChange} className="hidden" />
              <label htmlFor="profileImage" className="cursor-pointer flex flex-col items-center">
                <div className="w-20 h-20 rounded-full border-2 border-[#4AEEFF]/40 mb-3 overflow-hidden bg-[#061D23] flex items-center justify-center">
                  {imagePreview ? <img src={imagePreview} className="w-full h-full object-cover" /> : <span className="text-2xl">📸</span>}
                </div>
                <span className="text-sm font-semibold text-[#4AEEFF]">{imagePreview ? "Change Photo" : "Upload Profile Photo *"}</span>
              </label>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-xs font-bold text-[#D8FBFF]/70 uppercase tracking-widest mb-2">First Name</label>
                <input type="text" required value={formData.firstName} onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                       className="w-full bg-[#12679E]/10 border border-[#12679E]/40 rounded-xl px-4 py-3 text-white focus:border-[#4AEEFF] outline-none" />
              </div>
              <div>
                <label className="block text-xs font-bold text-[#D8FBFF]/70 uppercase tracking-widest mb-2">Last Name</label>
                <input type="text" required value={formData.lastName} onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                       className="w-full bg-[#12679E]/10 border border-[#12679E]/40 rounded-xl px-4 py-3 text-white focus:border-[#4AEEFF] outline-none" />
              </div>
              <div>
                <label className="block text-xs font-bold text-[#D8FBFF]/70 uppercase tracking-widest mb-2">Email</label>
                <input type="email" required value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                       className="w-full bg-[#12679E]/10 border border-[#12679E]/40 rounded-xl px-4 py-3 text-white focus:border-[#4AEEFF] outline-none" />
              </div>
              <div>
                <label className="block text-xs font-bold text-[#D8FBFF]/70 uppercase tracking-widest mb-2">Phone</label>
                <input type="tel" required value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                       className="w-full bg-[#12679E]/10 border border-[#12679E]/40 rounded-xl px-4 py-3 text-white focus:border-[#4AEEFF] outline-none" />
              </div>
              <div className="md:col-span-2 relative">
                <label className="block text-xs font-bold text-[#D8FBFF]/70 uppercase tracking-widest mb-2">Password</label>
                <input type={showPassword ? "text" : "password"} required value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                       className="w-full bg-[#12679E]/10 border border-[#12679E]/40 rounded-xl pl-4 pr-12 py-3 text-white focus:border-[#4AEEFF] outline-none" />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-10 text-[#4AEEFF]/60 hover:text-[#4AEEFF]">
                  {showPassword ? "👁" : "👁‍🗨"}
                </button>
              </div>
            </div>

            <div className="pt-4 border-t border-[#12679E]/30">
              <label className="block text-xs font-bold text-[#D8FBFF]/70 uppercase tracking-widest mb-3">Role</label>
              <div className="flex gap-4">
                {["PLAYER", "REFEREE", "ADMIN"].map((role) => (
                  <label key={role} className={`flex-1 p-3 rounded-xl border text-center cursor-pointer transition-colors ${formData.role === role ? "bg-[#4AEEFF]/10 border-[#4AEEFF] text-[#4AEEFF]" : "bg-[#12679E]/10 border-[#12679E]/40 text-[#D8FBFF]/50 hover:bg-[#12679E]/20"}`}>
                    <input type="radio" name="role" value={role} checked={formData.role === role} onChange={(e) => setFormData({ ...formData, role: e.target.value })} className="hidden" />
                    <span className="text-xs font-bold uppercase tracking-wider">{role}</span>
                  </label>
                ))}
              </div>
            </div>

            {formData.role === "PLAYER" && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-4">
                <div>
                  <label className="block text-xs font-bold text-[#D8FBFF]/70 uppercase tracking-widest mb-2">Gender</label>
                  <select required value={formData.playerProfile.gender} onChange={(e) => setFormData({ ...formData, playerProfile: { ...formData.playerProfile, gender: e.target.value } })}
                          className="w-full bg-[#12679E]/10 border border-[#12679E]/40 rounded-xl px-4 py-3 text-white focus:border-[#4AEEFF] outline-none">
                    <option value="" className="bg-[#0d2d38]">Select</option>
                    <option value="MALE" className="bg-[#0d2d38]">Male</option>
                    <option value="FEMALE" className="bg-[#0d2d38]">Female</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#D8FBFF]/70 uppercase tracking-widest mb-2">Date of Birth</label>
                  <input type="date" required value={formData.playerProfile.dateOfBirth} onChange={(e) => calculateAgeCategory(e.target.value)}
                         className="w-full bg-[#12679E]/10 border border-[#12679E]/40 rounded-xl px-4 py-3 text-white focus:border-[#4AEEFF] outline-none" />
                  {ageCategory && <p className="text-xs text-[#4AEEFF] mt-1 font-semibold">{ageCategory} Category</p>}
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#D8FBFF]/70 uppercase tracking-widest mb-2">Skill Level</label>
                  <select required value={formData.playerProfile.skillLevel} onChange={(e) => setFormData({ ...formData, playerProfile: { ...formData.playerProfile, skillLevel: e.target.value } })}
                          className="w-full bg-[#12679E]/10 border border-[#12679E]/40 rounded-xl px-4 py-3 text-white focus:border-[#4AEEFF] outline-none">
                    <option value="Beginner" className="bg-[#0d2d38]">Beginner</option>
                    <option value="Intermediate" className="bg-[#0d2d38]">Intermediate</option>
                    <option value="Advanced" className="bg-[#0d2d38]">Advanced</option>
                    <option value="Professional" className="bg-[#0d2d38]">Professional</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#D8FBFF]/70 uppercase tracking-widest mb-2">Club (Optional)</label>
                  <input type="text" value={formData.playerProfile.clubAffiliation} onChange={(e) => setFormData({ ...formData, playerProfile: { ...formData.playerProfile, clubAffiliation: e.target.value } })}
                         className="w-full bg-[#12679E]/10 border border-[#12679E]/40 rounded-xl px-4 py-3 text-white focus:border-[#4AEEFF] outline-none" />
                </div>
                <div className="lg:col-span-2">
                  <label className="block text-xs font-bold text-[#D8FBFF]/70 uppercase tracking-widest mb-2">Registration Fee Receipt *</label>
                  <div className="flex items-center gap-4">
                    <label className="cursor-pointer bg-[#12679E]/20 hover:bg-[#12679E]/40 border border-[#12679E]/40 text-[#4AEEFF] px-4 py-3 rounded-xl transition-colors font-bold text-sm">
                      Upload Receipt
                      <input type="file" accept="image/*,application/pdf" className="hidden" onChange={handleReceiptChange} />
                    </label>
                    {receiptName && <span className="text-sm text-[#D8FBFF]/60 truncate max-w-xs">📎 {receiptName}</span>}
                  </div>
                </div>
              </div>
            )}

            <button type="submit" disabled={isLoading} className="w-full bg-gradient-to-r from-[#4AEEFF] to-[#12679E] text-[#061D23] font-black py-4 rounded-xl text-sm uppercase tracking-widest hover:from-[#CFF9FF] hover:to-[#4AEEFF] transition-all mt-4">
              {isLoading ? "Creating Account…" : "Create Account"}
            </button>

            <div className="text-center pt-4">
              <p className="text-sm text-[#D8FBFF]/40">Already have an account? <Link to="/login" className="text-[#4AEEFF] font-bold hover:underline">Sign In</Link></p>
            </div>
          </form>
        </motion.div>
      </div>

      {/* ── Right Half: Abstract Visual ── */}
      <div className="hidden lg:flex w-5/12 relative overflow-hidden bg-[#0a2535] border-l border-[#12679E]/30 items-center justify-center"
           style={{ background: "linear-gradient(135deg, #0a2535 0%, #061D23 100%)" }}>
        <div className="absolute top-1/3 left-1/4 w-96 h-96 rounded-full opacity-[0.08] blur-3xl pointer-events-none" style={{ background: "radial-gradient(circle, #4AEEFF, transparent)" }} />
        <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] rounded-full opacity-[0.05] blur-3xl pointer-events-none" style={{ background: "radial-gradient(circle, #12679E, transparent)" }} />
        <div className="absolute inset-0 pointer-events-none opacity-10" style={{ backgroundImage: `linear-gradient(#4AEEFF 1px, transparent 1px), linear-gradient(90deg, #4AEEFF 1px, transparent 1px)`, backgroundSize: "60px 60px" }} />
        <div className="relative z-10 m-auto max-w-md text-center px-8">
          <div className="w-32 h-32 mx-auto mb-8 bg-gradient-to-br from-[#12679E] to-[#4AEEFF]/40 rounded-3xl flex items-center justify-center border border-[#4AEEFF]/30 shadow-[0_0_50px_rgba(74,238,255,0.2)]">
            <span className="text-6xl text-white">🏆</span>
          </div>
          <h3 className="text-3xl font-black text-white mb-4">Join the Elite</h3>
          <p className="text-[#D8FBFF]/60 text-lg">Create your profile to start competing in tournaments, tracking your matches, and climbing the global ranks.</p>
        </div>
      </div>
    </div>
  );
};

export default Register;