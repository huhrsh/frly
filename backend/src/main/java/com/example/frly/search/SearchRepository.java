package com.example.frly.search;

import jakarta.persistence.EntityManager;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Repository;

import java.util.ArrayList;
import java.util.List;

@Repository
@RequiredArgsConstructor
public class SearchRepository {

    private final EntityManager entityManager;

    private static final String SEARCH_SQL =
        "SELECT 'SECTION' AS match_type, s.id AS section_id, s.title AS section_title, CAST(s.type AS text) AS section_type, CAST(NULL AS bigint) AS item_id, s.title AS item_text " +
        "FROM config.sections s " +
        "WHERE s.group_id = :gid AND s.status != 'DELETED' AND s.title ILIKE :q " +
        "UNION ALL " +
        "SELECT 'ITEM', s.id, s.title, 'LIST', li.id, li.text " +
        "FROM config.list_items li JOIN config.sections s ON s.id = li.section_id " +
        "WHERE li.group_id = :gid AND li.status != 'DELETED' AND li.text ILIKE :q " +
        "UNION ALL " +
        "SELECT 'ITEM', s.id, s.title, 'NOTE', n.id, LEFT(n.content, 120) " +
        "FROM config.notes n JOIN config.sections s ON s.id = n.section_id " +
        "WHERE n.group_id = :gid AND n.status != 'DELETED' AND n.content ILIKE :q " +
        "UNION ALL " +
        "SELECT 'ITEM', s.id, s.title, 'REMINDER', r.id, r.title " +
        "FROM config.reminders r JOIN config.sections s ON s.id = r.section_id " +
        "WHERE r.group_id = :gid AND r.status != 'DELETED' AND (r.title ILIKE :q OR r.description ILIKE :q) " +
        "UNION ALL " +
        "SELECT 'ITEM', s.id, s.title, 'CALENDAR', e.id, e.title " +
        "FROM config.calendar_events e JOIN config.sections s ON s.id = e.section_id " +
        "WHERE e.group_id = :gid AND (e.title ILIKE :q OR e.description ILIKE :q OR e.location ILIKE :q) " +
        "UNION ALL " +
        "SELECT 'ITEM', s.id, s.title, 'GALLERY', g.id, COALESCE(g.title, g.original_filename) " +
        "FROM config.gallery_items g JOIN config.sections s ON s.id = g.section_id " +
        "WHERE g.group_id = :gid AND g.status != 'DELETED' AND (g.title ILIKE :q OR g.original_filename ILIKE :q) " +
        "UNION ALL " +
        "SELECT 'ITEM', s.id, s.title, 'LINKS', lk.id, lk.link_key " +
        "FROM config.link_items lk JOIN config.sections s ON s.id = lk.section_id " +
        "WHERE lk.group_id = :gid AND lk.status != 'DELETED' AND (lk.link_key ILIKE :q OR lk.description ILIKE :q OR lk.url ILIKE :q) " +
        "UNION ALL " +
        "SELECT 'ITEM', s.id, s.title, 'PAYMENT', pe.id, pe.description " +
        "FROM config.payment_expenses pe JOIN config.sections s ON s.id = pe.section_id " +
        "WHERE pe.group_id = :gid AND pe.status != 'DELETED' AND pe.description ILIKE :q " +
        "LIMIT 30";

    @SuppressWarnings("unchecked")
    public List<SearchResultDto> search(String groupId, String query) {
        String pattern = "%" + query + "%";
        List<Object[]> rows = entityManager.createNativeQuery(SEARCH_SQL)
                .setParameter("gid", groupId)
                .setParameter("q", pattern)
                .getResultList();

        List<SearchResultDto> results = new ArrayList<>();
        for (Object[] row : rows) {
            String matchType = (String) row[0];
            Long sectionId = row[1] != null ? ((Number) row[1]).longValue() : null;
            String sectionTitle = (String) row[2];
            String sectionType = (String) row[3];
            Long itemId = row[4] != null ? ((Number) row[4]).longValue() : null;
            String itemText = (String) row[5];
            results.add(new SearchResultDto(matchType, sectionId, sectionTitle, sectionType, itemId, itemText));
        }
        return results;
    }
}
