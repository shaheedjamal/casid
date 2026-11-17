import path from 'path';
import type Database from 'better-sqlite3';
import { getDb } from '../../backend/config/db';
import { runMigrations } from '../migrate';

export function seedDatabase(dbInstance?: Database.Database): void {
  const db = dbInstance || getDb();
  runMigrations(db);

  // Check if categories already exist (idempotent seeding)
  const existingCategories = db.prepare('SELECT COUNT(*) as count FROM categories').get() as { count: number };
  if (existingCategories.count > 0) {
    return;
  }

  const seedTx = db.transaction(() => {
    // 1. Seed Categories
    const insertCategory = db.prepare(`
      INSERT INTO categories (name, slug, description, image_url, status)
      VALUES (@name, @slug, @description, @image_url, @status)
    `);

    const categories = [
      {
        name: 'Cardiovascular Formulations',
        slug: 'cardiovascular-formulations',
        description: 'Oral solid dosage therapies developed for blood pressure management, lipid regulation, and long-term vascular care.',
        image_url: '/src/assets/images/product_oral_formulations_1794888600765.jpg',
        status: 'active',
      },
      {
        name: 'Anti-Infective Therapies',
        slug: 'anti-infective-therapies',
        description: 'Broad-spectrum oral and parenteral antimicrobial formulations manufactured under strict environmental controls.',
        image_url: '/src/assets/images/product_sterile_vials_1794888601163.jpg',
        status: 'active',
      },
      {
        name: 'Metabolic & Endocrine Care',
        slug: 'metabolic-endocrine-care',
        description: 'Precision-dosed oral formulations supporting glycemic balance and chronic metabolic management.',
        image_url: '/src/assets/images/product_oral_formulations_1794888600765.jpg',
        status: 'active',
      },
      {
        name: 'Sterile Parenterals',
        slug: 'sterile-parenterals',
        description: 'Aseptically filled sterile vial solutions and lyophilized injectables for hospital and acute-care settings.',
        image_url: '/src/assets/images/product_sterile_vials_1794888601163.jpg',
        status: 'active',
      },
      {
        name: 'Pain & Inflammation',
        slug: 'pain-and-inflammation',
        description: 'Targeted analgesic and anti-inflammatory solid oral tablets engineered for consistent dissolution profiles.',
        image_url: '/src/assets/images/product_oral_formulations_1794888600765.jpg',
        status: 'active',
      },
    ];

    const categoryIds: Record<string, number> = {};
    for (const cat of categories) {
      const info = insertCategory.run(cat);
      categoryIds[cat.slug] = Number(info.lastInsertRowid);
    }

    // 2. Seed Products
    const insertProduct = db.prepare(`
      INSERT INTO products (
        name, slug, sku, category_id, dosage_form, strength, therapeutic_area,
        short_description, description, composition, packaging_info, storage_conditions,
        image_url, is_featured, status
      ) VALUES (
        @name, @slug, @sku, @category_id, @dosage_form, @strength, @therapeutic_area,
        @short_description, @description, @composition, @packaging_info, @storage_conditions,
        @image_url, @is_featured, @status
      )
    `);

    const products = [
      {
        name: 'Casidil-AM 5/50',
        slug: 'casidil-am-5-50',
        sku: 'CP-CV-101',
        category_id: categoryIds['cardiovascular-formulations'],
        dosage_form: 'Film-Coated Tablet',
        strength: '5 mg / 50 mg',
        therapeutic_area: 'Cardiovascular Care',
        short_description: 'Dual-agent antihypertensive tablet formulated for once-daily blood pressure management.',
        description: 'Casidil-AM 5/50 combines a dihydropyridine calcium channel blocker with an angiotensin II receptor blocker in a moisture-protected film-coated tablet designed for predictable release and patient adherence.',
        composition: 'Each film-coated tablet contains Amlodipine Besilate equivalent to Amlodipine 5 mg and Losartan Potassium 50 mg.',
        packaging_info: 'Alu-Alu blister strips of 10 tablets; 3 strips per unit carton (30 tablets).',
        storage_conditions: 'Store below 25°C in a dry place, protected from light and moisture.',
        image_url: '/src/assets/images/product_oral_formulations_1794888600765.jpg',
        is_featured: 1,
        status: 'published',
      },
      {
        name: 'Atorvacid 20',
        slug: 'atorvacid-20',
        sku: 'CP-CV-104',
        category_id: categoryIds['cardiovascular-formulations'],
        dosage_form: 'Film-Coated Tablet',
        strength: '20 mg',
        therapeutic_area: 'Lipid Management',
        short_description: 'HMG-CoA reductase inhibitor tablet engineered for uniform dissolution and chemical stability.',
        description: 'Atorvacid 20 is manufactured using micronized active pharmaceutical ingredient granulation to ensure consistent bioavailability and batch-to-batch uniformity across shelf life.',
        composition: 'Each film-coated tablet contains Atorvastatin Calcium equivalent to Atorvastatin 20 mg.',
        packaging_info: 'Blister packs of 10 x 10 tablets in tamper-evident cartons.',
        storage_conditions: 'Store at controlled room temperature between 15°C and 25°C.',
        image_url: '/src/assets/images/product_oral_formulations_1794888600765.jpg',
        is_featured: 1,
        status: 'published',
      },
      {
        name: 'Cefcasid Sterile 1g',
        slug: 'cefcasid-sterile-1g',
        sku: 'CP-AI-202',
        category_id: categoryIds['sterile-parenterals'],
        dosage_form: 'Lyophilized Powder for Injection',
        strength: '1000 mg',
        therapeutic_area: 'Hospital Anti-Infective',
        short_description: 'Sterile cephalosporin powder in Type I flint glass vial for intravenous or intramuscular reconstitution.',
        description: 'Produced within ISO-classified aseptic filling suites, Cefcasid Sterile 1g undergoes 100% visual inspection and validated container-closure integrity verification prior to batch release.',
        composition: 'Each sterile single-dose vial contains Ceftriaxone Sodium equivalent to anhydrous Ceftriaxone 1000 mg.',
        packaging_info: '10 mL Type I clear glass vial with bromobutyl rubber stopper and flip-off aluminum seal.',
        storage_conditions: 'Store unreconstituted vials below 25°C in the outer carton to protect from light.',
        image_url: '/src/assets/images/product_sterile_vials_1794888601163.jpg',
        is_featured: 1,
        status: 'published',
      },
      {
        name: 'Metcasid XR 500',
        slug: 'metcasid-xr-500',
        sku: 'CP-ME-301',
        category_id: categoryIds['metabolic-endocrine-care'],
        dosage_form: 'Extended-Release Tablet',
        strength: '500 mg',
        therapeutic_area: 'Endocrine & Metabolic',
        short_description: 'Hydrophilic matrix extended-release tablet calibrated for gradual gastrointestinal absorption.',
        description: 'Metcasid XR 500 utilizes a dual-polymer matrix release architecture designed to smooth plasma concentration curves and improve gastrointestinal tolerability.',
        composition: 'Each extended-release tablet contains Metformin Hydrochloride 500 mg.',
        packaging_info: 'PVC/PVDC blister strips of 15 tablets; 4 strips per box (60 tablets).',
        storage_conditions: 'Store in a cool, dry environment below 30°C.',
        image_url: '/src/assets/images/product_oral_formulations_1794888600765.jpg',
        is_featured: 0,
        status: 'published',
      },
      {
        name: 'Azicasid 500',
        slug: 'azicasid-500',
        sku: 'CP-AI-209',
        category_id: categoryIds['anti-infective-therapies'],
        dosage_form: 'Film-Coated Tablet',
        strength: '500 mg',
        therapeutic_area: 'Respiratory & Systemic Infections',
        short_description: 'Macrolide antibiotic tablet formulated with taste-masked aqueous film coating.',
        description: 'Azicasid 500 undergoes full impurity profiling via validated HPLC analytical methods to maintain pharmacopoeial purity throughout distribution.',
        composition: 'Each film-coated tablet contains Azithromycin Dihydrate equivalent to Azithromycin 500 mg.',
        packaging_info: 'Blister strip of 3 tablets in single-course carton; hospital packs of 30 tablets.',
        storage_conditions: 'Store between 15°C and 30°C away from excessive humidity.',
        image_url: '/src/assets/images/product_oral_formulations_1794888600765.jpg',
        is_featured: 0,
        status: 'published',
      },
      {
        name: 'Paracasid IV 100mL',
        slug: 'paracasid-iv-100ml',
        sku: 'CP-SP-405',
        category_id: categoryIds['sterile-parenterals'],
        dosage_form: 'Intravenous Solution',
        strength: '10 mg / mL',
        therapeutic_area: 'Acute Pain & Perioperative Care',
        short_description: 'Ready-to-infuse sterile parenteral analgesic solution in terminal-sterilized glass bottle.',
        description: 'Formulated for hospital perioperative and critical-care settings, Paracasid IV 100mL is terminally sterilized and tested for bacterial endotoxins and particulate matter.',
        composition: 'Each 100 mL glass vial contains Paracetamol 1000 mg (10 mg/mL) in sterile aqueous isotonic buffer.',
        packaging_info: '100 mL molded clear glass infusion bottle with hanger label.',
        storage_conditions: 'Store below 25°C. Do not refrigerate or freeze.',
        image_url: '/src/assets/images/product_sterile_vials_1794888601163.jpg',
        is_featured: 1,
        status: 'published',
      },
    ];

    for (const prod of products) {
      insertProduct.run(prod);
    }

    // 3. Seed Pages (Home, About, Research, Quality, Contact, Privacy Policy, Terms)
    const insertPage = db.prepare(`
      INSERT INTO pages (slug, title, subtitle, hero_image_url, content_json, meta_description, status)
      VALUES (@slug, @title, @subtitle, @hero_image_url, @content_json, @meta_description, @status)
    `);

    const pages = [
      {
        slug: 'home',
        title: 'Precision Pharmaceutical Formulations Built on Rigorous Science',
        subtitle: 'Casid Pharma integrates formulation research, controlled manufacturing, and end-to-end batch traceability to supply dependable medicines to healthcare partners.',
        hero_image_url: '/src/assets/images/hero_pharma_lab_1794888599256.jpg',
        meta_description: 'Casid Pharma corporate homepage showcasing pharmaceutical formulations, R&D capabilities, quality governance, and latest news.',
        status: 'published',
        content_json: JSON.stringify({
          heroPrimaryCta: 'Explore Product Catalogue',
          heroSecondaryCta: 'Contact Medical Affairs',
          introHeading: 'Advancing Reliable Therapeutics Through Disciplined Formulation',
          introBody: 'At Casid Pharma, every dosage form begins with physicochemical characterization, excipient compatibility screening, and validated analytical methods. Our operational focus centers on consistent bioavailability, cleanroom environmental discipline, and transparent documentation across our therapeutic portfolio.',
          whyChooseItems: [
            {
              index: '01',
              title: 'Validated Analytical Control',
              description: 'Every production lot is verified in-house using HPLC, dissolution profiling, and stability chambers prior to quality assurance release.',
            },
            {
              index: '02',
              title: 'Dedicated Oral & Sterile Suites',
              description: 'Segregated manufacturing lines for solid oral dosage forms and aseptic parenteral vials minimize cross-contamination risk.',
            },
            {
              index: '03',
              title: 'End-to-End Batch Traceability',
              description: 'Raw material qualification through finished-carton serialization ensures complete audit readiness for institutional partners.',
            },
          ],
          rdHighlightHeading: 'Formulation Science & Analytical R&D',
          rdHighlightBody: 'Our research teams focus on modified-release oral matrices, moisture-barrier packaging optimization, and stability-indicating analytical method development.',
          qualityHighlightHeading: 'Uncompromising Quality & Governance',
          qualityHighlightBody: 'Casid Pharma maintains structured Quality Management Systems aligned with international Good Manufacturing Practice (cGMP) and Good Documentation Practice (GDP) frameworks.',
        }),
      },
      {
        slug: 'about',
        title: 'About Casid Pharma',
        subtitle: 'A science-led pharmaceutical organization dedicated to formulation integrity, operational transparency, and long-term healthcare partnerships.',
        hero_image_url: '/src/assets/images/about_pharma_facility_1794888600146.jpg',
        meta_description: 'Learn about Casid Pharma history, corporate vision, mission, core values, and manufacturing capabilities.',
        status: 'published',
        content_json: JSON.stringify({
          overview: 'Casid Pharma is an independent pharmaceutical enterprise focused on the development, analytical validation, and controlled production of essential oral solid and sterile parenteral medicines.',
          history: 'Founded by pharmaceutical formulation specialists and quality engineers, Casid Pharma grew from an analytical testing and formulation laboratory into an integrated manufacturing campus serving hospital networks, institutional distributors, and regional healthcare systems.',
          vision: 'To be a trusted benchmark in essential pharmaceutical manufacturing where every formulation delivers predictable therapeutic performance and verifiable quality.',
          mission: 'To combine disciplined formulation science, modern cleanroom engineering, and transparent quality governance so healthcare providers can rely on every Casid Pharma batch.',
          coreValues: [
            { title: 'Patient Safety First', detail: 'Every formulation and packaging decision is evaluated through the lens of clinical safety and stability.' },
            { title: 'Data Integrity', detail: 'ALCOA+ documentation standards govern our laboratory notebooks, batch manufacturing records, and audit logs.' },
            { title: 'Scientific Rigor', detail: 'Decisions in formulation and scale-up are grounded in empirical dissolution, impurity, and stability evidence.' },
            { title: 'Accountable Stewardship', detail: 'Responsible sourcing, solvent recovery, and workplace safety guide our facility operations.' },
          ],
          capabilities: [
            'Wet and dry granulation oral solid tablet compression and film coating',
            'Hydrophilic matrix extended-release dosage development',
            'Aseptic liquid filling and lyophilization for small-volume parenterals',
            'ICH-aligned accelerated and long-term stability testing suites',
          ],
          qualityCommitment: 'Quality assurance operates independently of production scheduling at Casid Pharma, holding full authority over raw material release, in-process controls, and finished-product disposition.',
        }),
      },
      {
        slug: 'research',
        title: 'Research & Development',
        subtitle: 'Translating formulation chemistry and analytical precision into stable, reproducible medicines.',
        hero_image_url: '/src/assets/images/rd_molecular_research_1794888599854.jpg',
        meta_description: 'Explore Casid Pharma R&D overview, formulation research activities, active projects, and technical publications.',
        status: 'published',
        content_json: JSON.stringify({
          overview: 'Our Research & Development center bridges early pre-formulation screening and commercial technology transfer. By embedding Quality by Design (QbD) principles into each development stage, we identify critical material attributes and process parameters before scale-up.',
          activities: [
            {
              code: '01',
              title: 'Pre-Formulation & Excipient Compatibility',
              description: 'Thermal analysis, particle size distribution characterization, and binary excipient stress studies to ensure long-term chemical stability.',
            },
            {
              code: '02',
              title: 'Modified-Release Dosage Engineering',
              description: 'Design of multi-layer and hydrophilic polymer matrix tablets tailored for controlled, predictable drug release kinetics.',
            },
            {
              code: '03',
              title: 'Analytical Method Validation',
              description: 'Development of stability-indicating HPLC/UPLC assay and related-substances methods validated for specificity, linearity, and precision.',
            },
          ],
          projects: [
            {
              title: 'Moisture-Resistant Bilayer Cardiovascular Tablet Platform',
              stage: 'Scale-Up Characterization',
              focus: 'Evaluating low-moisture direct compression excipients for hygroscopic fixed-dose combinations.',
            },
            {
              title: 'Preservative-Free Sterile Parenteral Buffer Optimization',
              stage: 'Analytical Validation',
              focus: 'Improving pH stability and extractables/leachables profiling across Type I glass vial configurations.',
            },
            {
              title: 'Accelerated Dissolution Correlation Modeling',
              stage: 'Formulation Screening',
              focus: 'Mapping multi-media dissolution profiles to optimize polymer viscosity grades in extended-release matrices.',
            },
          ],
          publications: [
            {
              title: 'Application of Quality by Design in Moisture-Sensitive Bilayer Tablet Compression',
              year: '2026',
              author: 'Casid Formulation Science Group',
              summary: 'Technical whitepaper examining compression force, dwell time, and tablet friability across pilot batches.',
            },
            {
              title: 'Stability-Indicating Chromatographic Profiling for Multi-Component Oral Therapies',
              year: '2025',
              author: 'Casid Analytical Development Team',
              summary: 'Methodological overview of forced-degradation protocols used during pre-commercial stability qualification.',
            },
          ],
        }),
      },
      {
        slug: 'quality',
        title: 'Quality & Compliance',
        subtitle: 'Structured Quality Management Systems anchored in documented verification, data integrity, and pharmacovigilance.',
        hero_image_url: '/src/assets/images/news_qc_laboratory_1794888601901.jpg',
        meta_description: 'Review Casid Pharma quality management architecture, compliance standards, and verified governance documentation.',
        status: 'published',
        content_json: JSON.stringify({
          overview: 'At Casid Pharma, quality is engineered into the manufacturing lifecycle rather than inspected only at the end of production. Our Quality Unit maintains strict separation of duties between manufacturing execution and batch release authority.',
          qmsPillars: [
            {
              title: 'Good Manufacturing Practice (cGMP) Alignment',
              description: 'Standard Operating Procedures govern facility sanitation, HVAC differential pressures, equipment qualification (IQ/OQ/PQ), and personnel gowning.',
            },
            {
              title: 'Laboratory & Analytical Integrity',
              description: 'Audit-trailed chromatography data systems, calibrated balances, and dual-analyst verification protect analytical reliability.',
            },
            {
              title: 'Supplier Qualification & Raw Material Testing',
              description: 'Active pharmaceutical ingredients and excipients are sourced exclusively from audited vendors and tested upon receipt prior to release.',
            },
            {
              title: 'Pharmacovigilance & Post-Market Surveillance',
              description: 'Dedicated medical inquiry and adverse-event intake channels ensure rapid investigation and corrective/preventive action (CAPA).',
            },
          ],
          certificationsNote: 'Casid Pharma publishes only verified, current regulatory approvals and third-party quality audit records. Official certificate copies and scope schedules are issued directly by our Quality Assurance team to partner institutions upon verification.',
          verifiedRecords: [
            {
              standard: 'Internal Quality Management Framework (QMS-01)',
              scope: 'Oral solid & sterile parenteral batch documentation and CAPA governance',
              status: 'Active Internal Standard · Reviewed Annually',
            },
            {
              standard: 'ALCOA+ Electronic Data Integrity Protocol',
              scope: 'Laboratory chromatography, stability chambers, and audit-trail retention',
              status: 'Active Compliance Policy · Verified in Audit Logs',
            },
            {
              standard: 'External Regulatory & GMP Certificates',
              scope: 'Jurisdiction-specific manufacturing and product registration dossiers',
              status: 'Available via QA Verification Request (Not auto-generated)',
            },
          ],
        }),
      },
      {
        slug: 'contact',
        title: 'Contact Casid Pharma',
        subtitle: 'Reach our corporate office, product enquiry desk, quality assurance team, or medical affairs specialists.',
        hero_image_url: '/src/assets/images/about_pharma_facility_1794888600146.jpg',
        meta_description: 'Contact Casid Pharma for product enquiries, distribution partnerships, quality documentation, or corporate information.',
        status: 'published',
        content_json: JSON.stringify({
          companyName: 'Casid Pharma Corporate Headquarters',
          addressLine1: 'Plot 42, Life Sciences & Pharmaceutical Park',
          addressLine2: 'Industrial Innovation Corridor, Sector IV',
          cityCountry: 'Chennai 600113, India',
          email: 'enquiries@casidpharma.com',
          medicalAffairsEmail: 'quality@casidpharma.com',
          phone: '+91 (044) 2498-7410',
          officeHours: 'Monday – Friday · 09:00 to 18:00 IST',
          directionsNote: 'Visitors to the manufacturing and R&D campus require prior appointment registration with Quality & Security.',
        }),
      },
      {
        slug: 'privacy-policy',
        title: 'Privacy Policy',
        subtitle: 'How Casid Pharma collects, processes, and safeguards personal and corporate enquiry information.',
        hero_image_url: '',
        meta_description: 'Casid Pharma Privacy Policy governing website enquiries, data retention, and security controls.',
        status: 'published',
        content_json: JSON.stringify({
          effectiveDate: '2026-01-15',
          sections: [
            {
              heading: '1. Information We Collect',
              body: 'When you submit a product or corporate enquiry through our website, Casid Pharma collects the contact details you voluntarily provide, including your name, email address, telephone number, organization name, subject, and message contents.',
            },
            {
              heading: '2. Purpose of Processing',
              body: 'Submitted enquiry records are stored securely in our administrative database solely to evaluate and respond to your commercial, medical information, or partnership request, and to maintain an auditable record of communication.',
            },
            {
              heading: '3. Data Security & Access Control',
              body: 'Administrative access to enquiry records is restricted to authenticated Casid Pharma personnel governed by role-based access controls (RBAC) and continuous audit logging. Passwords are protected via salted cryptographic hashing.',
            },
            {
              heading: '4. Data Retention & Deletion Requests',
              body: 'Enquiry records are retained only for as long as necessary to fulfill the stated correspondence purpose or applicable regulatory documentation obligations. You may request review or deletion of your submitted contact record by contacting our privacy desk.',
            },
          ],
        }),
      },
      {
        slug: 'terms-and-conditions',
        title: 'Terms and Conditions',
        subtitle: 'Terms governing access to the Casid Pharma corporate website and product information resources.',
        hero_image_url: '',
        meta_description: 'Terms and conditions for using the Casid Pharma corporate portal and reviewing pharmaceutical product listings.',
        status: 'published',
        content_json: JSON.stringify({
          effectiveDate: '2026-01-15',
          sections: [
            {
              heading: '1. Informational Scope',
              body: 'The product summaries, formulation specifications, and research updates published on this website are provided for general corporate, institutional, and healthcare-professional reference. They do not constitute medical advice, diagnosis, or treatment recommendations.',
            },
            {
              heading: '2. Regulatory & Prescribing Context',
              body: 'Availability, approved indications, and prescribing information for pharmaceutical products depend on applicable national regulatory authorities. Always consult official local product labeling and qualified medical professionals.',
            },
            {
              heading: '3. Intellectual Property',
              body: 'All Casid Pharma wordmarks, technical documentation, formulation summaries, and photography displayed on this website remain the property of Casid Pharma and may not be reproduced commercially without written authorization.',
            },
            {
              heading: '4. Portal Security & Acceptable Use',
              body: 'Unauthorized attempts to access administrative routes, bypass authentication controls, or upload malicious payloads are strictly prohibited and logged for security investigation.',
            },
          ],
        }),
      },
    ];

    for (const page of pages) {
      insertPage.run(page);
    }

    // 4. Seed News & Announcements
    const insertNews = db.prepare(`
      INSERT INTO news (title, slug, category_label, summary, content, image_url, published_at, status)
      VALUES (@title, @slug, @category_label, @summary, @content, @image_url, @published_at, @status)
    `);

    const newsItems = [
      {
        title: 'Casid Pharma Commissions Expanded Analytical Quality Control Suite',
        slug: 'expanded-analytical-quality-control-suite',
        category_label: 'Facility Milestone',
        summary: 'New high-precision chromatography systems and stability chambers increase batch testing throughput across oral and sterile lines.',
        content: `Casid Pharma has commissioned an expanded Analytical Quality Control suite at its primary manufacturing campus, strengthening in-house capacity for raw material verification, dissolution profiling, and ICH stability monitoring.\n\nThe upgraded laboratory integrates automated UPLC-DAD analytical instruments alongside calibrated microbalances and environmental stability chambers operating under 21 CFR Part 11-aligned audit trail controls.\n\n"Expanding our analytical capacity directly supports shorter batch-release lead times without compromising the depth of verification performed on every production lot," noted the Head of Quality Operations. The facility will support both current commercial formulations and upcoming modified-release development candidates.`,
        image_url: '/src/assets/images/news_qc_laboratory_1794888601901.jpg',
        published_at: '2026-10-18T09:00:00Z',
        status: 'published',
      },
      {
        title: 'Formulation R&D Completes Pilot Scale-Up for Moisture-Barrier Cardiovascular Line',
        slug: 'pilot-scale-up-moisture-barrier-cardiovascular',
        category_label: 'Research Update',
        summary: 'Pre-commercial characterization validates tablet hardness, content uniformity, and packaging integrity for bilayer formulations.',
        content: `The Casid Pharma Formulation Science team has completed pilot-scale process characterization for its next-generation moisture-protected cardiovascular oral solid platform.\n\nUsing Quality by Design (QbD) experimental matrices, engineers evaluated roller compaction pressure, film-coating weight gain, and Alu-Alu blister barrier performance under accelerated humidity stress.\n\nAnalytical testing confirmed uniform active distribution and consistent dissolution across pilot batches, paving the way for formal stability qualification.`,
        image_url: '/src/assets/images/rd_molecular_research_1794888599854.jpg',
        published_at: '2026-09-24T10:30:00Z',
        status: 'published',
      },
      {
        title: 'Annual Hospital Supply & Sterile Parenteral Cold-Chain Readiness Review',
        slug: 'annual-hospital-supply-sterile-parenteral-review',
        category_label: 'Corporate Announcement',
        summary: 'Casid Pharma strengthens institutional distribution protocols and serialized batch traceability ahead of the 2027 hospital supply cycle.',
        content: `Casid Pharma has concluded its annual distribution and supply-chain readiness audit covering sterile parenteral injectables and essential oral therapies.\n\nKey enhancements include upgraded carton-level batch serialization, temperature-excursion validation along regional transport lanes, and faster medical-affairs response workflows through the new digital enquiry portal.\n\nInstitutional procurement partners can submit batch documentation requests or product enquiries directly via our Contact Us page.`,
        image_url: '/src/assets/images/product_sterile_vials_1794888601163.jpg',
        published_at: '2026-08-12T08:00:00Z',
        status: 'published',
      },
    ];

    for (const item of newsItems) {
      insertNews.run(item);
    }

    // 5. Seed Media entries for the generated corporate assets
    const insertMedia = db.prepare(`
      INSERT INTO media (filename, original_name, mime_type, file_size, url, alt_text)
      VALUES (@filename, @original_name, @mime_type, @file_size, @url, @alt_text)
    `);

    const seedMedia = [
      {
        filename: 'hero_pharma_lab_1794888599256.jpg',
        original_name: 'hero_pharma_lab.jpg',
        mime_type: 'image/jpeg',
        file_size: 245000,
        url: '/src/assets/images/hero_pharma_lab_1794888599256.jpg',
        alt_text: 'Casid Pharma analytical and formulation research laboratory',
      },
      {
        filename: 'about_pharma_facility_1794888600146.jpg',
        original_name: 'about_pharma_facility.jpg',
        mime_type: 'image/jpeg',
        file_size: 230000,
        url: '/src/assets/images/about_pharma_facility_1794888600146.jpg',
        alt_text: 'Casid Pharma corporate headquarters and manufacturing campus',
      },
      {
        filename: 'rd_molecular_research_1794888599854.jpg',
        original_name: 'rd_molecular_research.jpg',
        mime_type: 'image/jpeg',
        file_size: 215000,
        url: '/src/assets/images/rd_molecular_research_1794888599854.jpg',
        alt_text: 'Pharmaceutical scientist operating chromatography instrumentation',
      },
      {
        filename: 'product_oral_formulations_1794888600765.jpg',
        original_name: 'product_oral_formulations.jpg',
        mime_type: 'image/jpeg',
        file_size: 195000,
        url: '/src/assets/images/product_oral_formulations_1794888600765.jpg',
        alt_text: 'Oral solid tablet packaging and blister strips',
      },
      {
        filename: 'product_sterile_vials_1794888601163.jpg',
        original_name: 'product_sterile_vials.jpg',
        mime_type: 'image/jpeg',
        file_size: 210000,
        url: '/src/assets/images/product_sterile_vials_1794888601163.jpg',
        alt_text: 'Sterile pharmaceutical glass injection vials on stainless steel tray',
      },
      {
        filename: 'news_qc_laboratory_1794888601901.jpg',
        original_name: 'news_qc_laboratory.jpg',
        mime_type: 'image/jpeg',
        file_size: 225000,
        url: '/src/assets/images/news_qc_laboratory_1794888601901.jpg',
        alt_text: 'Quality assurance analysts performing laboratory weight and assay checks',
      },
    ];

    for (const m of seedMedia) {
      insertMedia.run(m);
    }

    // 6. Seed Sample Enquiries
    const insertEnquiry = db.prepare(`
      INSERT INTO enquiries (reference_code, name, email, phone, company, subject, message, status)
      VALUES (@reference_code, @name, @email, @phone, @company, @subject, @message, @status)
    `);

    insertEnquiry.run({
      reference_code: 'ENQ-2026-0101',
      name: 'Dr. Priya Nair',
      email: 'p.nair@metrogeneralhospital.org',
      phone: '+91 98400 11223',
      company: 'Metro General Hospital Pharmacy',
      subject: 'Institutional Formulary Dossier Request — Cefcasid Sterile 1g',
      message: 'We are updating our hospital parenteral formulary for Q1 and would like batch stability specifications and institutional supply lead times for Cefcasid Sterile 1g.',
      status: 'pending',
    });

    insertEnquiry.run({
      reference_code: 'ENQ-2026-0102',
      name: 'Arjun Menon',
      email: 'arjun.menon@southernmedsupply.com',
      phone: '+91 94441 78210',
      company: 'Southern MedSupply Distribution',
      subject: 'Regional Distribution Partnership Enquiry',
      message: 'Seeking wholesale distribution terms and cold-chain storage documentation for Casid Pharma cardiovascular and parenteral product lines.',
      status: 'reviewed',
    });

    // 7. Seed System Settings
    const insertSetting = db.prepare(`
      INSERT OR IGNORE INTO system_settings (key, value) VALUES (?, ?)
    `);
    insertSetting.run('site_name', 'Casid Pharma');
    insertSetting.run('support_email', 'enquiries@casidpharma.com');
    insertSetting.run('maintenance_mode', 'false');
    insertSetting.run('enquiry_retention_days', '365');

    // 8. Initial Audit Log
    db.prepare(`
      INSERT INTO audit_logs (user_email, action, entity_type, entity_id, details, ip_address)
      VALUES ('system', 'DATABASE_SEEDED', 'system', '0', 'Initial corporate schema, categories, products, CMS pages, news, and media assets seeded.', '127.0.0.1')
    `).run();
  });

  seedTx();
}
