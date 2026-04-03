package com.example.frly.search;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/groups/search")
@RequiredArgsConstructor
public class SearchController {

    private final SearchService searchService;

    @GetMapping
    public ResponseEntity<List<SearchResultDto>> search(@RequestParam String q) {
        return ResponseEntity.ok(searchService.search(q));
    }
}
