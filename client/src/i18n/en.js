const en = {
  // Common & Header
  appTitle: "Kural Padivam",
  appSubtitle: "Voice-Based Form Assistant",
  langToggle: "தமிழ்",
  currentLang: "English",
  welcome: "Welcome! Fill out your forms easily with your voice.",
  welcomeSub: "Speak in Tamil, review your information, and save it securely.",
  fillNewForm: "Fill a New Form",
  privacySecured: "Secured Data",
  offlineReady: "Local Execution",
  profile: "Profile",
  logout: "Logout",

  // Navigation
  navDashboard: "Dashboard",
  navNewForm: "New Form",
  navVoiceFilling: "Voice Filling",
  navSavedForms: "Saved Forms",
  navHelpCentre: "Help Centre",
  navRecentAccess: "Recent Access",
  navPrivacy: "Privacy Centre",
  navSettings: "Settings",

  // Dashboard Cards
  cardNewFormTitle: "New Form",
  cardNewFormDesc: "Upload a blank form or select a sample form template.",
  cardVoiceTitle: "Fill by Voice",
  cardVoiceDesc: "Start guided voice filling or speak all information at once.",
  cardSavedTitle: "Saved Forms",
  cardSavedDesc: "View saved records with sensitive values securely masked.",
  cardHelpTitle: "Form Assistance",
  cardHelpDesc: "Understand field meanings and locate where information appears on documents.",
  cardPrivacyTitle: "Privacy Centre",
  cardPrivacyDesc: "Explain data protection, AES encryption, and AI privacy commitments.",
  cardRecentTitle: "Recent Activity",
  cardRecentDesc: "Track recent non-sensitive actions such as saving or exporting forms.",

  // Dashboard Overview
  totalSavedForms: "Total Saved Forms",
  formsCompletedSession: "Completed This Session",
  completionRate: "Completion Rate",
  recentFormUsed: "Most Recently Used Form",
  noRecentForm: "No form started yet",
  noSavedRecords: "No saved form records found.",

  // Quick Actions
  quickActions: "Quick Actions",
  btnStartNew: "Start a New Form",
  btnContinueCurrent: "Continue Current Form",
  btnViewSaved: "View Saved Forms",
  btnPrivacySettings: "Open Privacy Settings",

  // Upload & Sample Forms
  selectFormType: "Select Form Type",
  uploadBlankForm: "Upload Blank Form",
  uploadWarning: "Do not upload your personal documents; upload blank forms only.",
  dragDropOrClick: "Drag & drop PDF, JPG or PNG file here or click to select (Max 10MB)",
  builtinSampleForms: "Built-in Sample Forms",
  scholarshipForm: "Scholarship Application",
  rationForm: "Ration Card Application",
  customForm: "Uploaded Form",
  scholarshipDesc: "Financial assistance application form for students",
  rationDesc: "Application form for issuing new smart family card",
  previewFields: "Preview Form Fields",
  editDetectedFields: "Edit / Add / Reorder Fields",
  addField: "Add New Field",
  fieldName: "Field Label",
  fieldType: "Field Type",
  isSensitive: "Sensitive Field?",
  isRequired: "Required Field?",
  startFillingBtn: "Start Filling Form",

  // Voice Filling Modes
  chooseFillingMode: "Choose Voice Filling Mode",
  guidedModeTitle: "Guided Voice Filling (Field-by-Field)",
  guidedModeDesc: "The assistant asks questions field by field. Speak your answers one by one.",
  allAtOnceTitle: "Speak Everything at Once (Full Sentence)",
  allAtOnceDesc: "Speak a complete paragraph or sentence containing all your form details.",
  demoSentencesTitle: "Tamil Demo Sentences (Test without microphone)",
  demoSentencesDesc: "Click any sample Tamil sentence below to test the full parsing & validation workflow:",

  // Voice Controls
  spokeText: "You Spoke:",
  isThisCorrect: "Is this correct?",
  btnRepeat: "Repeat",
  btnSkip: "Skip",
  btnEdit: "Edit",
  btnConfirm: "Confirm",
  btnPrevious: "Previous",
  btnNext: "Next",
  btnListening: "Listening...",
  btnStartMic: "Start Speaking",
  btnStopMic: "Stop Speaking",
  typedInputFallback: "Or type your input manually:",

  // Sensitive & Privacy Warnings
  sensitiveNotice: "Aadhaar, Phone, and Bank Account numbers are processed strictly inside your browser. They are NEVER sent to Gemini AI servers.",
  verhoeffInvalid: "Invalid Aadhaar number (Verhoeff checksum failed)",
  phoneInvalid: "Invalid phone number (10 digits starting with 6, 7, 8, or 9 required)",
  bankInvalid: "Invalid bank account number (9 to 18 digits required)",
  ifscInvalid: "Invalid IFSC code (e.g. SBIN0001234)",
  pinInvalid: "Invalid PIN code (6 digits required)",
  incomeInvalid: "Income must be a valid positive number",
  ageDobMismatch: "Age and Date of Birth do not match",

  // Review & Confirmation
  reviewScreenTitle: "Form Review & Completion",
  completionPercentage: "Completion Status",
  remainingRequired: "Required Fields Remaining",
  validationWarnings: "Validation Warnings",
  missingRequiredNotice: "Fields remaining to be filled:",
  reviewAloudBtn: "Review Form Aloud",
  saveSecurelyBtn: "Save Securely",
  downloadPdfBtn: "Download PDF",
  clearAllBtn: "Clear Information",
  confirmClearMsg: "Are you sure you want to clear all information? Unsaved data will be lost permanently.",

  // Field Help & Document Guide
  whatIsThis: "What is this?",
  whereToFind: "Where can I find it?",
  fieldExplanationTitle: "Field Explanation",
  docGuideTitle: "Document Guidance",
  guideNotFoundMsg: "Location information for this document is unavailable. Please consult your local VAO office or e-Sevai centre.",
  fictionalSampleNotice: "The document below is a sample demonstration with fictional data.",

  // Saved Records & Reveal Flow
  savedRecordsTitle: "Securely Saved Form Records",
  maskedValueNotice: "Sensitive fields are masked for security (e.g., ********9012).",
  revealBtn: "Reveal Value",
  revealedTimer: "Value will automatically re-mask in 10 seconds...",
  verifyPasswordModalTitle: "Password / PIN Verification",
  enterPasswordOrPin: "Enter your password or 6-digit PIN to reveal sensitive information:",
  incorrectAuthMsg: "Incorrect password / PIN. Access locks for 5 minutes after 5 failed attempts.",
  accessLockedMsg: "Access locked for 5 minutes due to 5 consecutive failed attempts.",

  // Auth
  loginTitle: "Login",
  signupTitle: "Create Account",
  usernameLabel: "Username",
  passwordLabel: "Password",
  pinLabel: "6-Digit Security PIN",
  recoveryCodeLabel: "Recovery Code",
  saveRecoveryCodeNotice: "Please save your recovery code securely. You will need it to recover your password:",
  btnLogin: "Login",
  btnSignup: "Sign Up",
  noAccount: "Don't have an account? Sign up",
  hasAccount: "Already have an account? Login",

  // Settings Page
  settingsTitle: "Settings",
  voiceSpeedLabel: "Voice Speed",
  voicePromptToggle: "Enable Spoke Audio Prompts",
  textSizeLabel: "Text Size",
  changePasswordBtn: "Change Password",
  clearCurrentFormBtn: "Clear Current Form",
  deleteAllRecordsBtn: "Delete All Saved Records",
  deleteAccountBtn: "Delete Account Permanently",

  // Privacy Page
  privacyCenterTitle: "Privacy Protection Centre",
  privacyPoints: [
    "1. Voice audio is not recorded or stored anywhere by the application.",
    "2. Speech recognition converts speech into text instantly in browser memory.",
    "3. Sensitive numbers like Aadhaar and Phone are processed strictly inside your browser.",
    "4. Sensitive values are encrypted using AES-GCM 256-bit client-side before storage.",
    "5. Saved sensitive values remain masked until password / PIN verification.",
    "6. Only non-sensitive form details are sent to Gemini AI for processing.",
    "7. API keys remain strictly stored on the server environment.",
    "8. Keep your account recovery code safe for emergency access.",
    "9. Unsaved information is permanently erased when session ends or cleared.",
    "10. Exporting a full PDF creates an unencrypted physical/digital copy of sensitive data."
  ],

  // Common UI Buttons
  confirm: "Confirm",
  cancel: "Cancel",
  save: "Save",
  close: "Close",
  loading: "Loading..."
};

export default en;
