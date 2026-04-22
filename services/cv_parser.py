import re
import json
import sys
from typing import Dict, List, Optional, Any
from pdfminer.high_level import extract_text

# ─────────────────────────────────────────────
# SKILLS & KEYWORDS DATABASE
# ─────────────────────────────────────────────

SKILLS_DB = [
    "python", "java", "c++", "c#", "javascript", "typescript",
    "html", "css", "php", "ruby", "swift", "kotlin", "go",
    "sql", "mysql", "postgresql", "mongodb", "firebase", "redis",
    "spring", "spring boot", "django", "flask", "fastapi", "laravel",
    "angular", "react", "vue", "next.js", "node.js", "express",
    "flutter", "react native",
    "git", "github", "docker", "kubernetes", "jenkins",
    "aws", "azure", "gcp", "linux",
    "machine learning", "deep learning", "tensorflow", "pytorch",
    "rest api", "graphql", "xml", "json",
    "agile", "scrum", "jira"
]

DEGREE_KEYWORDS = [
    "bachelor", "master", "phd", "doctorate",
    "engineering", "licence", "mastère", "ingénieur",
    "b.sc", "m.sc", "mba", "cycle"
]

JOB_TITLE_KEYWORDS = [
    "developer", "engineer", "intern", "stagiaire",
    "manager", "analyst", "architect",
    "consultant", "lead", "devops",
    "designer", "backend", "frontend",
    "data scientist"
]

SECTION_BLACKLIST = ["email", "phone", "skills", "education", "experience"]

# ─────────────────────────────────────────────
# UTILITIES
# ─────────────────────────────────────────────

def clean_text(text: str) -> str:
    """Nettoie le texte en préservant les sauts de ligne essentiels."""
    # Remplacer les espaces multiples par un seul
    text = re.sub(r'[ \t]+', ' ', text)
    # Réduire les sauts de ligne multiples à un seul
    text = re.sub(r'\n+', '\n', text)
    # Assurer un espace autour des labels
    text = re.sub(r'(?i)(Email:)', r' \1 ', text)
    text = re.sub(r'(?i)(Phone:)', r' \1 ', text)
    return text.strip()

def is_valid_line(text: str, max_length: int = 150) -> bool:
    """Vérifie si une ligne est valide pour le traitement (ni trop longue, ni vide)."""
    return bool(text and len(text.strip()) < max_length)

# ─────────────────────────────────────────────
# BASIC EXTRACTION
# ─────────────────────────────────────────────

def extract_email(text: str) -> Optional[str]:
    match = re.search(r'[\w.\-+]+@[\w\-]+\.[a-zA-Z]{2,6}', text)
    return match.group(0) if match else None

def extract_phone(text: str) -> Optional[str]:
    match = re.search(r'(\+?\d{1,3}[\s\-]?\(?\d{2,4}\)?[\s\-]?\d{2,4}[\s\-]?\d{2,4}[\s\-]?\d{0,4})', text)
    return match.group(0).strip() if match else None

def extract_name(text: str) -> Optional[str]:
    """Extrait le nom en cherchant la première ligne pertinente."""
    lines = [l.strip() for l in text.split('\n') if l.strip()]
    for line in lines[:5]:  # Le nom est généralement dans les 5 premières lignes
        if any(kw in line.lower() for kw in SECTION_BLACKLIST):
            continue
        # Cherche au moins deux mots commençant par une majuscule
        if re.match(r'^[A-Za-zÀ-ÿ]{2,}\s[A-Za-zÀ-ÿ]{2,}', line):
            return line.title()
    return None

# ─────────────────────────────────────────────
# SKILLS & LANGUAGES
# ─────────────────────────────────────────────

def extract_skills(text: str) -> List[str]:
    text_lower = text.lower()
    found = [skill for skill in SKILLS_DB if re.search(r'\b' + re.escape(skill) + r'\b', text_lower)]
    return sorted(list(set(found)))

def extract_languages(text: str) -> List[str]:
    lang_pattern = r'\b(french|english|arabic|german|spanish|français|anglais|arabe)\b'
    found = re.findall(lang_pattern, text.lower())
    return sorted(list(set([l.title() for l in found])))

# ─────────────────────────────────────────────
# EDUCATION & EXPERIENCE
# ─────────────────────────────────────────────

def extract_education(text: str) -> List[Dict[str, Optional[str]]]:
    results = []
    lines = text.split('\n')

    for line in lines:
        line_clean = line.strip()
        line_lower = line_clean.lower()

        if not is_valid_line(line_clean) or any(word in line_lower for word in SECTION_BLACKLIST):
            continue

        if any(kw in line_lower for kw in DEGREE_KEYWORDS):
            # Tente de séparer le diplôme de l'institution avec un tiret ou une virgule
            # Capture également les dates entre parenthèses
            match = re.match(r'^(.*?)(?:-|at|,)\s*(.*?)\s*\((.*?)\)', line_clean)
            
            if match:
                degree, institution, dates = match.groups()
                years = re.findall(r'(19|20)\d{2}', dates)
            else:
                # Fallback si le format n'utilise pas de tiret
                degree = line_clean
                institution = ""
                years = re.findall(r'(19|20)\d{2}', line_clean)

            entry = {
                "degree": degree.strip(),
                "institution": institution.strip() if 'institution' in locals() else "",
                "startYear": years[0] if len(years) > 0 else None,
                "endYear": years[1] if len(years) > 1 else None
            }
            results.append(entry)

    return results[:5]

def extract_experience(text: str) -> List[Dict[str, str]]:
    results = []
    lines = text.split('\n')

    for line in lines:
        line_clean = line.strip()
        line_lower = line_clean.lower()

        if not is_valid_line(line_clean) or any(word in line_lower for word in SECTION_BLACKLIST):
            continue

        if any(kw in line_lower for kw in JOB_TITLE_KEYWORDS):
            # Tente d'extraire tout ce qui est avant les parenthèses (Job + Company) et les dates dans les parenthèses
            match = re.match(r'^(.*?)\s*\((.*?)\)', line_clean)
            
            if match:
                job_and_company, dates_str = match.groups()
            else:
                job_and_company = line_clean
                dates_str = line_clean

            dates = re.findall(r'[A-Za-z]{3,}\s\d{4}|\d{4}', dates_str) # Cherche "Jun 2023" ou "2023"

            entry = {
                "jobTitle": job_and_company.strip(),
                "company": "", # Difficile à séparer du titre sans NLP avancé
                "startDate": dates[0] if len(dates) > 0 else "",
                "endDate": dates[1] if len(dates) > 1 else "Present",
                "description": ""
            }
            results.append(entry)

    return results[:8]

# ─────────────────────────────────────────────
# SCORING & MAIN
# ─────────────────────────────────────────────

def calculate_confidence(data: Dict[str, Any]) -> int:
    score = 0
    if data.get("name"): score += 10
    if data.get("email"): score += 15
    if data.get("phone"): score += 10
    
    score += min(len(data.get("skills", [])) * 3, 25)
    if data.get("education"): score += 15
    if data.get("experience"): score += 20

    return max(min(score, 100), 0)

def parse_cv(file_path: str) -> Dict[str, Any]:
    try:
        text = extract_text(file_path)
    except Exception as e:
         return {"status": "error", "message": f"Erreur de lecture PDF: {str(e)}"}

    text = clean_text(text)

    data = {
        "name": extract_name(text),
        "email": extract_email(text),
        "phone": extract_phone(text),
        "skills": extract_skills(text),
        "education": extract_education(text),
        "experience": extract_experience(text),
        "languages": extract_languages(text),
    }

    data["total_skills"] = len(data["skills"])
    data["confidence_score"] = calculate_confidence(data)

    return data

# ─────────────────────────────────────────────
# CLI
# ─────────────────────────────────────────────

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print(json.dumps({
            "status": "error",
            "message": "Usage: python extract_cv.py <path_to_cv.pdf>"
        }))
        sys.exit(1)

    result = parse_cv(sys.argv[1])
    print(json.dumps(result, ensure_ascii=False, indent=2))