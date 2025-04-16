<?php
function lowercaseFirstLetterKeysArray(array $rows): array {
    return array_map(function ($row) {
        $newRow = [];
        foreach ($row as $key => $value) {
            $newKey = lcfirst($key);
            $newRow[$newKey] = $value;
        }
        return $newRow;
    }, $rows);
}

function lowercaseFirstLetterKeys(array $row): array {
    $newRow = [];
    foreach ($row as $key => $value) {
        $newKey = lcfirst($key);
        $newRow[$newKey] = $value;
    }
    return $newRow;
}
?>