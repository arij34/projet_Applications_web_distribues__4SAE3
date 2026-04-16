package tn.freelancy.skillmanagement.Controller;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import tn.freelancy.skillmanagement.service.PythonCvService;

@RestController
@RequestMapping("/cv")
@RequiredArgsConstructor
public class CvController {

    private final PythonCvService pythonCvService;

    @PostMapping("/upload")
    public ResponseEntity<String> uploadCv(@RequestParam("file") MultipartFile file) {
        String response = pythonCvService.sendCvToPython(file);
        return ResponseEntity.ok(response);
    }
}