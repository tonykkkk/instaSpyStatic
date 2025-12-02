// Используем библиотеку JSZip для работы с архивами
// Подключите библиотеку: <script src="https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js"></script>
var JSZip = require("jszip");
async function extractFollowersAndFollowing(zipFile) {
  try {
    // Загружаем ZIP архив
    const zipData = await JSZip.loadAsync(zipFile);

    // Проверяем существование файлов
    const followersPath =
      "connections/followers_and_following/followers_1.json";
    const followingPath = "connections/followers_and_following/following.json";

    if (!zipData.file(followersPath) || !zipData.file(followingPath)) {
      throw new Error("Один или оба файла не найдены в архиве");
    }

    // Извлекаем и парсим файлы
    const followersContent = await zipData.file(followersPath).async("text");
    const followingContent = await zipData.file(followingPath).async("text");

    // Парсим JSON
    let followersData = JSON.parse(followersContent);
    let followingData = JSON.parse(followingContent);

    // Функция для преобразования данных в массив объектов
    function transformData(data, type) {
      if (type === "followers") {
        // Структура followers_1.json: {"followers": [{"string_list_data": [...]}]}
        if (data.followers && Array.isArray(data.followers)) {
          return data.followers.map((item) => {
            return {
              username: item.string_list_data?.[0]?.value || "",
              timestamp: item.string_list_data?.[0]?.timestamp || "",
              href: item.string_list_data?.[0]?.href || "",
              type: "follower",
            };
          });
        }
      } else if (type === "following") {
        // Структура following.json: {"relationships_following": [...]}
        if (
          data.relationships_following &&
          Array.isArray(data.relationships_following)
        ) {
          return data.relationships_following.map((item) => {
            return {
              username: item.string_list_data?.[0]?.value || "",
              timestamp: item.string_list_data?.[0]?.timestamp || "",
              href: item.string_list_data?.[0]?.href || "",
              type: "following",
            };
          });
        }
      }
      return [];
    }

    // Преобразуем данные
    const followersArray = transformData(followersData, "followers");
    const followingArray = transformData(followingData, "following");

    return {
      followers: followersArray,
      following: followingArray,
      stats: {
        followersCount: followersArray.length,
        followingCount: followingArray.length,
      },
    };
  } catch (error) {
    console.error("Ошибка при обработке архива:", error);
    throw error;
  }
}

// Альтернативная версия с более гибкой обработкой структуры файлов
async function extractSocialData(zipFile) {
  try {
    const zip = await JSZip.loadAsync(zipFile);

    const followersPaths = [
      "connections/followers_and_following/followers_1.json",
      "followers_1.json",
      "followers.json",
    ];

    const followingPaths = [
      "connections/followers_and_following/following.json",
      "following.json",
    ];

    // Находим файлы по разным возможным путям
    let followersFile, followingFile;

    for (const path of followersPaths) {
      if (zip.file(path)) {
        followersFile = zip.file(path);
        break;
      }
    }

    for (const path of followingPaths) {
      if (zip.file(path)) {
        followingFile = zip.file(path);
        break;
      }
    }
    if (!followersFile || !followingFile) {
      throw new Error("Файлы не найдены в архиве");
    }

    // Читаем файлы
    const [followersContent, followingContent] = await Promise.all([
      followersFile.async("text"),
      followingFile.async("text"),
    ]);

    // Парсим JSON
    const followersJson = JSON.parse(followersContent);
    const followingJson = JSON.parse(followingContent);

    // Универсальная функция для извлечения данных
    function extractUserData(data) {
      const result = [];

      // Рекурсивно ищем массивы с данными пользователей
      function findArrays(obj, path = "") {
        if (!obj || typeof obj !== "object") return;

        // Проверяем, является ли текущий объект похожим на данные пользователя
        if (obj.string_list_data && Array.isArray(obj.string_list_data)) {
          obj.string_list_data.forEach((item) => {
            if (item.value) {
              result.push({
                username: item.value,
                timestamp: item.timestamp || null,
                href: item.href || "",
                source: path,
              });
            }
          });
        }

        // Рекурсивно обходим все свойства
        for (const key in obj) {
          if (obj.hasOwnProperty(key)) {
            if (Array.isArray(obj[key])) {
              obj[key].forEach((item, index) => {
                findArrays(item, `${path}.${key}[${index}]`);
              });
            } else if (typeof obj[key] === "object") {
              findArrays(obj[key], `${path}.${key}`);
            }
          }
        }
      }

      findArrays(data, "root");
      return result;
    }

    const followers = extractUserData(followersJson);
    const following = extractUserData(followingJson);

    // Добавляем тип для каждого пользователя
    followers.forEach((user) => (user.type = "follower"));
    following.forEach((user) => (user.type = "following"));

    return {
      followers: followers,
      following: following,
      summary: {
        totalFollowers: followers.length,
        totalFollowing: following.length,
        // Находим тех, кто не подписан взаимно
        notFollowingBack: following
          .filter(
            (followingUser) =>
              !followers.some(
                (follower) => follower.username === followingUser.username
              )
          )
          .map((user) => user.username),
      },
    };
  } catch (error) {
    console.error("Error:", error);
    throw error;
  }
}

// Пример использования с файловым input
async function handleFileUpload(event) {
  const file = event.target.files[0];

  if (!file) {
    alert("Пожалуйста, выберите файл");
    return;
  }

  if (!file.name.endsWith(".zip")) {
    alert("Пожалуйста, выберите ZIP файл");
    return;
  }

  try {
    // Читаем файл как ArrayBuffer
    const arrayBuffer = await readFileAsArrayBuffer(file);

    // Извлекаем данные
    const result = await extractFollowersAndFollowing(arrayBuffer);

    console.log("Подписчики:", result.followers);
    console.log("Подписки:", result.following);
    console.log("Статистика:", result.stats);

    // Дополнительный анализ
    const notFollowingBack = result.following.filter(
      (followingUser) =>
        !result.followers.some(
          (follower) => follower.username === followingUser.username
        )
    );

    console.log("Не подписаны взаимно:", notFollowingBack.length);
  } catch (error) {
    console.error("Ошибка обработки файла:", error);
    alert("Ошибка при обработке файла: " + error.message);
  }
}

// Вспомогательная функция для чтения файла
function readFileAsArrayBuffer(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsArrayBuffer(file);
  });
}

// HTML для загрузки файла
/*
<input type="file" id="zipFileInput" accept=".zip" onchange="handleFileUpload(event)">
<div id="result"></div>
*/
