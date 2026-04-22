package tn.esprit.challengeservice.dtos;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;

@Data
@Schema(description = "Request body for saving Sonar points")
public class SaveSonarPointsRequest {

    @Schema(description = "Earned points for this challenge (0 to challenge max points)", example = "75", required = true)
    private Integer pointsAwarded;
}
