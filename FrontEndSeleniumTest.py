from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.chrome.service import Service
from webdriver_manager.chrome import ChromeDriverManager
import time

# Setup
driver = webdriver.Chrome(service=Service(ChromeDriverManager().install()))
wait = WebDriverWait(driver, 10)

try:
    # 1. Oldal megnyitása
    driver.get("http://localhost:5173") # Ellenőrizd a portot a Bun termináljában!

    # 2. login folyamat
    # Az első input a "Username" placeholderrel
    user_field = wait.until(EC.presence_of_element_located(
        (By.XPATH, "//input[@placeholder='Username']")))
    
    # A második input a "Password" placeholderrel
    pass_field = driver.find_element(By.XPATH, "//input[@placeholder='Password']")
    
    # A submit gomb
    login_btn = driver.find_element(By.XPATH, "//button[@type='submit']")

    # Adatok kitöltése
    # az adatbázisban már alapvetően létező adatokat használjuk
    time.sleep(1)  
    user_field.send_keys("admin")
    time.sleep(1)  
    pass_field.send_keys("admin")
    time.sleep(1)  
    login_btn.click()
    time.sleep(2)  # Várunk egy kicsit, hogy a login folyamat befejeződjön

    # 3. PLAY GAME
    # Itt várunk, amíg a React lerendereli a gombot a login után
    # Feltételezem, hogy a gomb szövege "Play Game"
    play_btn = wait.until(EC.element_to_be_clickable(
        (By.XPATH, "//button[contains(text(), 'Play Game')]")))
    play_btn.click()
    print("Belépve és Play megnyomva.")

    time.sleep(5)

    # 4. BACK GOMB
    # Keressük a szövege alapján (ha nincs ID)
    back_btn = wait.until(EC.element_to_be_clickable(
        (By.CLASS_NAME, "back")))  # Vagy használj egyedi osztályt vagy szöveg alapján
    back_btn.click()

    time.sleep(1)

    # 5. LOGOUT (Dropdown kezeléssel)
    print("Kijelentkezés megkezdése...")

    # Először megnyitjuk a dropdown menüt (a gomb, ami kinyitja)
    # A képed alapján 'dropdown-btn' volt az osztálya
    dropdown_trigger = wait.until(EC.element_to_be_clickable((By.CLASS_NAME, "dropdown-btn")))
    dropdown_trigger.click()
    
    # Várunk egy picit, amíg a React "kiteríti" a menüt (animáció miatt)
    time.sleep(0.5)

    # Most már kattintható a Logout link
    logout_link = wait.until(EC.element_to_be_clickable((By.LINK_TEXT, "Logout")))
    logout_link.click()

    print("Teszt sikeresen lefutott!")

except Exception as e:
    print(f"Hiba történt: {e}")
    driver.save_screenshot("error.png")

finally:
    driver.quit()