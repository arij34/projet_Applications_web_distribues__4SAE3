package tn.esprit.projet_module.clients;

public class ProjectSkillDTO {
    private String skillName;
    private String category;
    private String demand;

    public ProjectSkillDTO(String skillName, String category, String demand) {
        this.skillName = skillName;
        this.category = category;
        this.demand = demand;
    }

    public String getSkillName() {
        return skillName;
    }

    public void setSkillName(String skillName) {
        this.skillName = skillName;
    }

    public String getCategory() {
        return category;
    }

    public void setCategory(String category) {
        this.category = category;
    }

    public String getDemand() {
        return demand;
    }

    public void setDemand(String demand) {
        this.demand = demand;
    }
}