import re
import json
import sys

# pip install pdfplumber
import pdfplumber

# ─── Skills Database ──────────────────────────────────────────────
SKILLS_DB = [
    "python", "java", "c++", "c#", "javascript", "typescript",
    "html", "css", "php", "ruby", "swift", "kotlin", "go",
    "sql", "mysql", "postgresql", "mongodb", "firebase", "redis",
    "spring", "spring boot", "django", "flask", "fastapi", "laravel",
    "angular", "react", "vue", "next.js", "node.js", "express",
    "flutter", "flutterflow", "react native", "javafx", "qt",
    "git", "github", "docker", "kubernetes", "jenkins",
    "aws", "azure", "gcp", "linux",
    "machine learning", "deep learning", "tensorflow", "pytorch",
    "rest api", "graphql", "symfony", "hibernate",
    "agile", "scrum", "jira", "firebase", "c"
]

DEGREE_KEYWORDS = [
    "bachelor", "master", "phd", "doctorate",
    "engineering", "licence", "mastère", "ingénieur",
    "b.sc", "m.sc", "preparatory", "cycle ingénieur",
    "computer engineer", "génie informatique"
]

JOB_TITLE_KEYWORDS = [
    "developer", "engineer", "intern", "stagiaire", "manager",
    "analyst", "architect", "consultant", "lead", "devops",
    "designer", "full stack", "backend", "frontend", "data scientist",
    "intern - worker", "worker"
]

INSTITUTION_KEYWORDS = [
    "university", "université", "school", "école", "ecole",
    "institute", "esprit", "sup", "faculty", "college",
    "telecom", "enit", "insat", "iset", "fsb", "fst"
]


# ─── PDF Text Extraction (pdfplumber = proper lines) ─────────────
def extract_text_lines(file_path):
    """Extract text as clean list of lines using pdfplumber"""
    lines = []
    with pdfplumber.open(file_path) as pdf:
        for page in pdf.pages:
            text = page.extract_text()
            if text:
                for line in text.split('\n'):
                    clean = line.strip()
                    if clean:
                        lines.append(clean)
    return lines


# ─── Extractors ───────────────────────────────────────────────────

def extract_email(lines):
    for line in lines:
        match = re.search(r'[\w.\-+]+@[\w\-]+\.[a-zA-Z]{2,6}', line)
        if match:
            return match.group(0)
    return None


def extract_phone(lines):
    for line in lines:
        match = re.search(
            r'(\+?\d{1,3}[\s\-]?\(?\d{2,3}\)?[\s\-]?\d{2,3}[\s\-]?\d{2,3}[\s\-]?\d{0,3})',
            line
        )
        if match:
            phone = re.sub(r'\s+', ' ', match.group(0).strip())
            # Must be at least 8 digits total
            digits = re.sub(r'\D', '', phone)
            if len(digits) >= 8:
                return phone
    return None


def extract_name(lines):
    """Name is usually in the first few short lines, all caps or title case"""
    for line in lines[:8]:
        # Skip lines with contact info or keywords
        if any(kw in line.lower() for kw in [
            "engineer", "developer", "student", "profile",
            "@", "http", "www", "tel", "+", "tunisia", "ariana"
        ]):
            continue
        # Name: 2-3 words, only letters
        words = line.split()
        if 2 <= len(words) <= 4 and all(re.match(r'^[A-Za-zÀ-ÿ\-]+$', w) for w in words):
            return line.title()
    return None


def extract_skills(lines):
    full_text = ' '.join(lines).lower()
    found = []
    for skill in SKILLS_DB:
        # word boundary match
        pattern = r'\b' + re.escape(skill) + r'\b'
        if re.search(pattern, full_text):
            found.append(skill)
    return sorted(list(set(found)))


def extract_education(lines):
    """
    Look for lines containing degree keywords,
    then find institution + years nearby
    """
    results = []
    year_pattern = r'((?:sep|oct|nov|dec|jan|feb|mar|apr|may|jun|jul|aug)?\.?\s*(?:19|20)\d{2}|present)'

    for i, line in enumerate(lines):
        line_lower = line.lower()

        if any(kw in line_lower for kw in DEGREE_KEYWORDS):
            # Gather context: current line + next 3 lines
            context_lines = lines[i:min(i+4, len(lines))]
            context = ' '.join(context_lines)

            # Find years
            years = re.findall(year_pattern, context, re.IGNORECASE)
            # Filter out bad years (like 2081, 2003 from postal codes/dates of birth)
            valid_years = []
            for y in years:
                year_num = re.search(r'(19|20)\d{2}', y)
                if year_num:
                    yr = int(year_num.group())
                    if 1980 <= yr <= 2030:
                        valid_years.append(y.strip().title())

            # Find institution in nearby lines
            institution = ""
            for j in range(i, min(i+5, len(lines))):
                if any(kw in lines[j].lower() for kw in INSTITUTION_KEYWORDS):
                    institution = lines[j]
                    break

            entry = {
                "degree": line,
                "institution": institution,
                "startYear": valid_years[0] if len(valid_years) > 0 else None,
                "endYear": valid_years[1] if len(valid_years) > 1 else "Present"
            }

            # Avoid duplicates
            if line not in [e["degree"] for e in results]:
                results.append(entry)

    return results[:5]


def extract_experience(lines):
    """
    Look for lines with job title keywords,
    then extract company + dates nearby
    """
    results = []
    date_pattern = (
        r'((?:jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|'
        r'jul(?:y)?|aug(?:ust)?|sep(?:tember)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)'
        r'\.?\s*(?:19|20)\d{2}|(?:19|20)\d{2})'
    )

    for i, line in enumerate(lines):
        line_lower = line.lower()

        if any(kw in line_lower for kw in JOB_TITLE_KEYWORDS):
            context = ' '.join(lines[i:min(i+4, len(lines))])
            dates = re.findall(date_pattern, context, re.IGNORECASE)

            # Validate dates (not postal codes / birth dates)
            valid_dates = []
            for d in dates:
                year_match = re.search(r'(19|20)\d{2}', d)
                if year_match:
                    yr = int(year_match.group())
                    if 1990 <= yr <= 2030:
                        valid_dates.append(d.strip().title())

            # Find company: next line that looks like a proper name
            company = ""
            for j in range(i+1, min(i+4, len(lines))):
                next_line = lines[j]
                if (next_line != line
                        and re.match(r'^[A-Za-z]', next_line)
                        and len(next_line.split()) <= 5
                        and not any(kw in next_line.lower() for kw in JOB_TITLE_KEYWORDS)):
                    company = next_line
                    break

            # Description: first longer line after title
            description = ""
            for j in range(i+1, min(i+6, len(lines))):
                if len(lines[j]) > 40:
                    description = lines[j]
                    break

            entry = {
                "jobTitle": line,
                "company": company,
                "startDate": valid_dates[0] if len(valid_dates) > 0 else "",
                "endDate": valid_dates[1] if len(valid_dates) > 1 else "Present",
                "description": description
            }

            if line not in [e["jobTitle"] for e in results]:
                results.append(entry)

    return results[:8]


def extract_languages(lines):
    lang_map = {
        "french": "French", "français": "French",
        "english": "English", "anglais": "English",
        "arabic": "Arabic", "arabe": "Arabic",
        "german": "German", "allemand": "German",
        "spanish": "Spanish"
    }
    found = set()
    full_text = ' '.join(lines).lower()
    for key, value in lang_map.items():
        if re.search(r'\b' + key + r'\b', full_text):
            found.add(value)
    return list(found)


# ─── Main ─────────────────────────────────────────────────────────

def parse_cv(file_path):
    lines = extract_text_lines(file_path)
    skills = extract_skills(lines)

    return {
        "status": "success",
        "data": {
            "name":        extract_name(lines),
            "email":       extract_email(lines),
            "phone":       extract_phone(lines),
            "skills":      skills,
            "education":   extract_education(lines),
            "experience":  extract_experience(lines),
            "languages":   extract_languages(lines),
            "total_skills": len(skills)
        }
    }


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print(json.dumps({
            "status": "error",
            "message": "Usage: python extract_cv.py <path_to_cv.pdf>"
        }))
        sys.exit(1)

    result = parse_cv(sys.argv[1])
    print(json.dumps(result, ensure_ascii=False, indent=2))