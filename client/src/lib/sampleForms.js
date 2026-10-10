export const SAMPLE_FORMS = [
  {
    id: 'scholarship',
    titleTa: 'கல்வி உதவித்தொகை விண்ணப்பம்',
    titleEn: 'Scholarship Application',
    descTa: 'மாணவர்களுக்கான கல்வி நிதி உதவி பெற விண்ணப்பிக்கும் படிவம்.',
    descEn: 'Application form for students to receive financial educational assistance.',
    fields: [
      { id: 'studentName', labelTa: 'மாணவர் பெயர்', labelEn: 'Student Name', type: 'text', isSensitive: false, required: true },
      { id: 'fatherName', labelTa: 'தந்தை / பாதுகாவலர் பெயர்', labelEn: 'Father / Guardian Name', type: 'text', isSensitive: false, required: true },
      { id: 'age', labelTa: 'வயது', labelEn: 'Age', type: 'number', isSensitive: false, required: true },
      { id: 'dob', labelTa: 'பிறந்த தேதி', labelEn: 'Date of Birth', type: 'date', isSensitive: false, required: true },
      { id: 'institution', labelTa: 'கல்வி நிறுவனம் / கல்லூரி', labelEn: 'Institution / College', type: 'text', isSensitive: false, required: true },
      { id: 'income', labelTa: 'ஆண்டு வருமானம் (₹)', labelEn: 'Annual Income (₹)', type: 'number', isSensitive: false, required: true },
      { id: 'aadhaar', labelTa: 'ஆதார் எண்', labelEn: 'Aadhaar Number', type: 'text', isSensitive: true, required: true, isAadhaar: true },
      { id: 'phone', labelTa: 'தொலைபேசி எண்', labelEn: 'Phone Number', type: 'text', isSensitive: true, required: true, isPhone: true },
      { id: 'bankAccount', labelTa: 'வங்கி கணக்கு எண்', labelEn: 'Bank Account Number', type: 'text', isSensitive: true, required: true, isBank: true },
      { id: 'ifsc', labelTa: 'வங்கி IFSC குறியீடு', labelEn: 'Bank IFSC Code', type: 'text', isSensitive: true, required: true, isIFSC: true },
      { id: 'address', labelTa: 'வீட்டு முகவரி', labelEn: 'Residential Address', type: 'text', isSensitive: false, required: true }
    ]
  },
  {
    id: 'rationCard',
    titleTa: 'குடும்ப அட்டை விண்ணப்பம்',
    titleEn: 'Ration Card Application',
    descTa: 'புதிய ஸ்மார்ட் குடும்ப அட்டை பெறுவதற்கான அதிகாரப்பூர்வ விண்ணப்பம்.',
    descEn: 'Official application for issuing a new Smart Ration Card.',
    fields: [
      { id: 'headName', labelTa: 'குடும்பத் தலைவர் பெயர்', labelEn: 'Head of Family Name', type: 'text', isSensitive: false, required: true },
      { id: 'totalMembers', labelTa: 'உறுப்பினர்களின் எண்ணிக்கை', labelEn: 'Total Family Members', type: 'number', isSensitive: false, required: true },
      { id: 'district', labelTa: 'மாவட்டம்', labelEn: 'District', type: 'text', isSensitive: false, required: true },
      { id: 'taluk', labelTa: 'வட்டம் / தாலுகா', labelEn: 'Taluk', type: 'text', isSensitive: false, required: true },
      { id: 'pinCode', labelTa: 'அஞ்சல் குறியீடு (PIN Code)', labelEn: 'PIN Code', type: 'text', isSensitive: true, required: true, isPIN: true },
      { id: 'aadhaar', labelTa: 'குடும்பத் தலைவரின் ஆதார் எண்', labelEn: 'Head of Family Aadhaar', type: 'text', isSensitive: true, required: true, isAadhaar: true },
      { id: 'phone', labelTa: 'தொலைபேசி எண்', labelEn: 'Phone Number', type: 'text', isSensitive: true, required: true, isPhone: true },
      { id: 'address', labelTa: 'முகவரி', labelEn: 'Address', type: 'text', isSensitive: false, required: true }
    ]
  }
];

export const DEMO_SENTENCES = [
  {
    id: 'demo1',
    formId: 'scholarship',
    titleTa: 'கல்வி உதவித்தொகை — முழு விவரம்',
    titleEn: 'Scholarship — Complete Spoken Sentence',
    textTa: 'என் பெயர் மாதிரி செல்வன். தந்தை பெயர் மாதிரி வேல். வயது 20. பிறந்த தேதி 01/01/2006. கல்வி நிறுவனம் மாநிலக் கல்லூரி சென்னை. ஆண்டு வருமானம் 75000. எனது ஆதார் எண் 236589741258. போன் நம்பர் 9876543210. வங்கி கணக்கு எண் 123456789012. வங்கி IFSC குறியீடு SBIN0001234. முகவரி 12 அண்ணா நகர் சென்னை.',
    parsedMap: {
      studentName: 'மாதிரி செல்வன்',
      fatherName: 'மாதிரி வேல்',
      age: '20',
      dob: '2006-01-01',
      institution: 'மாநிலக் கல்லூரி சென்னை',
      income: '75000',
      aadhaar: '236589741258',
      phone: '9876543210',
      bankAccount: '123456789012',
      ifsc: 'SBIN0001234',
      address: '12 அண்ணா நகர் சென்னை'
    }
  },
  {
    id: 'demo2',
    formId: 'rationCard',
    titleTa: 'குடும்ப அட்டை — முழு விவரம்',
    titleEn: 'Ration Card — Complete Spoken Sentence',
    textTa: 'குடும்பத் தலைவர் பெயர் மாதிரி ராஜ். குடும்ப உறுப்பினர்கள் 4 நபர்கள். மாவட்டம் சென்னை. வட்டம் மயிலாப்பூர். அஞ்சல் குறியீடு 600004. ஆதார் எண் 236589741258. போன் 9876543210. முகவரி 45 காந்தி தெரு மயிலாப்பூர் சென்னை.',
    parsedMap: {
      headName: 'மாதிரி ராஜ்',
      totalMembers: '4',
      district: 'சென்னை',
      taluk: 'மயிலாப்பூர்',
      pinCode: '600004',
      aadhaar: '236589741258',
      phone: '9876543210',
      address: '45 காந்தி தெரு மயிலாப்பூர் சென்னை'
    }
  },
  {
    id: 'demo3',
    formId: 'scholarship',
    titleTa: 'தவறான ஆதார் & போன் எண் (எச்சரிக்கை சோதனை)',
    titleEn: 'Invalid Aadhaar & Phone (Validation Test)',
    textTa: 'மாணவர் பெயர் மாதிரி குமார். வயது 19. பிறந்த தேதி 01/05/2007. கல்லூரி அண்ணா பல்கலைக்கழகம். வருமானம் 60000. ஆதார் 123456789012. போன் 1234567890. முகவரி திருச்சி.',
    parsedMap: {
      studentName: 'மாதிரி குமார்',
      fatherName: 'மாதிரி முருகன்',
      age: '19',
      dob: '2007-05-01',
      institution: 'அண்ணா பல்கலைக்கழகம்',
      income: '60000',
      aadhaar: '123456789012', // Invalid Verhoeff checksum
      phone: '1234567890',    // Starts with 1 (invalid)
      address: 'திருச்சி'
    }
  },
  {
    id: 'demo4',
    formId: 'scholarship',
    titleTa: 'விடுபட்ட புலங்கள் (நிரப்பப்படாத புலன்கள் சோதனை)',
    titleEn: 'Missing Required Fields Test',
    textTa: 'மாணவர் பெயர் மாதிரி செல்வி. கல்லூரி கவர்மெண்ட் கல்லூரி. போன் நம்பர் 9876543210.',
    parsedMap: {
      studentName: 'மாதிரி செல்வி',
      institution: 'கவர்மெண்ட் கல்லூரி',
      phone: '9876543210'
    }
  }
];
