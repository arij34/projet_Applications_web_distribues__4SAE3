package tn.esprit.challengeservice.exceptions;

public class SonarResultsNotFoundException extends RuntimeException {

    public SonarResultsNotFoundException(String message) {
        super(message);
    }
}
