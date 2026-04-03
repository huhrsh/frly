package com.example.frly.search;

import com.example.frly.group.GroupContext;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.Collections;
import java.util.List;

@Service
@RequiredArgsConstructor
public class SearchService {

    private final SearchRepository searchRepository;

    public List<SearchResultDto> search(String query) {
        if (query == null || query.trim().length() < 2) {
            return Collections.emptyList();
        }
        String groupId = GroupContext.getGroupId();
        if (groupId == null) {
            return Collections.emptyList();
        }
        return searchRepository.search(groupId, query.trim());
    }
}
