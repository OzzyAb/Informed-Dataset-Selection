<?php
function lowerFirstLetter($data) {
    if (is_object($data)) {
        $result = new stdClass();
        foreach ($data as $key => $value) {
            $newKey = lcfirst($key);
            $result->$newKey = lowerFirstLetter($value);
        }
        return $result;
    }

    if (is_array($data)) {
        $result = [];
        foreach ($data as $key => $value) {
            $newKey = lcfirst($key);
            $result[$newKey] = lowerFirstLetter($value);
        }
        return $result;
    }

    return $data;
}
?>