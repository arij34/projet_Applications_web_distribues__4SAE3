package tn.esprit.challengeservice.controllers;

import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;
import tn.esprit.challengeservice.entities.Task;
import tn.esprit.challengeservice.entities.TaskStatus;
import tn.esprit.challengeservice.services.itaskService;

import java.util.List;

@RestController
@RequestMapping("/tasks")
@RequiredArgsConstructor
@CrossOrigin("*")
public class TaskController {

    private final itaskService taskService;

    @PostMapping("/{challengeId}")
    public Task addTask(@PathVariable String challengeId, @RequestBody Task task) {
        return taskService.addTask(challengeId, task);
    }

    @GetMapping("/challenge/{challengeId}")
    public List<Task> getTasksByChallenge(@PathVariable String challengeId) {
        return taskService.getTasksByChallenge(challengeId);
    }

    @PutMapping("/{id}")
    public Task updateTask(@PathVariable String id, @RequestBody Task task) {
        return taskService.updateTask(id, task);
    }

    @PatchMapping("/{id}/status")
    public Task updateTaskStatus(@PathVariable String id, @RequestParam String status) {
        try {
            TaskStatus taskStatus = TaskStatus.valueOf(status.toUpperCase().trim());
            return taskService.updateTaskStatus(id, taskStatus);
        } catch (IllegalArgumentException e) {
            throw new RuntimeException("Invalid status. Valid values: COMPLETE, COMPLETED, INPROGRESS, INCOMPLETE, CLOSED, ACTIVE");
        }
    }

    @DeleteMapping("/{id}")
    public void deleteTask(@PathVariable String id) {
        taskService.deleteTask(id);
    }
}
