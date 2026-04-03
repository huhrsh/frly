package com.example.frly.search;

import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public class SearchResultDto {
    private String matchType;     // "SECTION" or "ITEM"
    private Long sectionId;
    private String sectionTitle;
    private String sectionType;
    private Long itemId;          // null when matchType is SECTION
    private String itemText;      // matched snippet
}
