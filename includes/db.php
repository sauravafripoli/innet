<?php

if (!defined('IN_GS')) {
    die('You cannot load this page directly.');
}


/*
|--------------------------------------------------------------------------
| INETT ENERGY DATABASE CONNECTION
|--------------------------------------------------------------------------
|
| SQLite repository used by the Energy analytics website.
|
*/

$dbPath = __DIR__ . '/../energy-data/energy.db';


if (!file_exists($dbPath)) {
    die('INETT Energy database could not be found.');
}


try {

    $energyDb = new PDO(
        'sqlite:' . $dbPath
    );

    $energyDb->setAttribute(
        PDO::ATTR_ERRMODE,
        PDO::ERRMODE_EXCEPTION
    );

    $energyDb->setAttribute(
        PDO::ATTR_DEFAULT_FETCH_MODE,
        PDO::FETCH_ASSOC
    );


} catch (PDOException $exception) {

    die(
        'Database connection failed: ' .
        htmlspecialchars(
            $exception->getMessage()
        )
    );
}