package com.example.frly.search;

import com.example.frly.group.GroupContext;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class SearchServiceTest {

    @Mock private SearchRepository searchRepository;

    @InjectMocks
    private SearchService searchService;

    @AfterEach
    void tearDown() {
        GroupContext.clear();
    }

    // ─── guard clauses ────────────────────────────────────────────────────────

    @Test
    void search_withNullQuery_returnsEmptyWithoutCallingRepository() {
        GroupContext.setGroupId("group-1");

        List<SearchResultDto> result = searchService.search(null);

        assertTrue(result.isEmpty());
        verifyNoInteractions(searchRepository);
    }

    @Test
    void search_withSingleCharQuery_returnsEmptyWithoutCallingRepository() {
        GroupContext.setGroupId("group-1");

        List<SearchResultDto> result = searchService.search("a");

        assertTrue(result.isEmpty());
        verifyNoInteractions(searchRepository);
    }

    @Test
    void search_withWhitespaceOnlyQuery_returnsEmptyWithoutCallingRepository() {
        GroupContext.setGroupId("group-1");

        // Single space trims to empty string (length < 2)
        List<SearchResultDto> result = searchService.search(" ");

        assertTrue(result.isEmpty());
        verifyNoInteractions(searchRepository);
    }

    @Test
    void search_withNoGroupContext_returnsEmptyWithoutCallingRepository() {
        // GroupContext not set — getGroupId() returns null

        List<SearchResultDto> result = searchService.search("groceries");

        assertTrue(result.isEmpty());
        verifyNoInteractions(searchRepository);
    }

    // ─── delegation ──────────────────────────────────────────────────────────

    @Test
    void search_withValidQueryAndGroup_delegatesToRepository() {
        GroupContext.setGroupId("group-1");
        SearchResultDto dto = buildResult("SECTION", "group-1", "Shopping", "LIST");
        when(searchRepository.search("group-1", "shop")).thenReturn(List.of(dto));

        List<SearchResultDto> result = searchService.search("shop");

        assertEquals(1, result.size());
        assertEquals("Shopping", result.get(0).getSectionTitle());
    }

    @Test
    void search_trimsQueryBeforePassingToRepository() {
        GroupContext.setGroupId("group-1");
        when(searchRepository.search(eq("group-1"), eq("shop"))).thenReturn(List.of());

        searchService.search("  shop  ");

        verify(searchRepository).search("group-1", "shop");
    }

    @Test
    void search_returnsEmptyListWhenRepositoryFindsNothing() {
        GroupContext.setGroupId("group-1");
        when(searchRepository.search(anyString(), anyString())).thenReturn(List.of());

        List<SearchResultDto> result = searchService.search("xyzzy");

        assertTrue(result.isEmpty());
    }

    @Test
    void search_passesCorrectGroupIdToRepository() {
        GroupContext.setGroupId("abc-group-99");
        when(searchRepository.search(anyString(), anyString())).thenReturn(List.of());

        searchService.search("hello");

        verify(searchRepository).search(eq("abc-group-99"), anyString());
    }

    // ─── helpers ─────────────────────────────────────────────────────────────

    private SearchResultDto buildResult(String matchType, String groupId,
                                        String sectionTitle, String sectionType) {
        return new SearchResultDto(matchType, null, sectionTitle, sectionType, null, null);
    }
}
