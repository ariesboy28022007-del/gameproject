import pygame
import random

pygame.init()

WIDTH, HEIGHT = 600, 800
screen = pygame.display.set_mode((WIDTH, HEIGHT))
pygame.display.set_caption("King of the Hill")

# Загрузка иконки
icon = pygame.image.load("images/icon.png").convert_alpha()
pygame.display.set_icon(icon)

# Загрузка фона
bg = pygame.image.load("images/bg.png").convert_alpha()
bg = pygame.transform.scale(bg, (WIDTH, HEIGHT))

clock = pygame.time.Clock()

# Загрузка шрифта
font = pygame.font.Font("fonts/Datatype-VariableFont_wdth,wght.ttf", 60)
font_small = pygame.font.Font("fonts/Datatype-VariableFont_wdth,wght.ttf", 30)

# Загрузка фоновой музыки
pygame.mixer.music.load("sounds/gameprojectsound.mp3")
pygame.mixer.music.play(-1)  # -1 means circuit


class Player:
    def __init__(self):
        self.rect = pygame.Rect(250, 600, 30, 60) #Size of the player
        self.velocity_y = 0
        self.speed = 5
        self.on_ground = False
        self.facing = "right"  # Sides: right, left
        
        # image of the player
        self.default_image = pygame.image.load("images/main_plr.png").convert_alpha()
        self.default_image = pygame.transform.scale(self.default_image, (self.rect.width, self.rect.height))
        self.image = self.default_image
        
        # animation frames for right movement
        self.frames_right = []
        for i in range(1, 4):
            img = pygame.image.load(f"images/plr_right/plr_right{i}.png").convert_alpha()
            img = pygame.transform.scale(img, (self.rect.width, self.rect.height))
            self.frames_right.append(img)
        
        # animation frames for left movement
        self.frames_left = []
        for i in range(1, 4):
            img = pygame.image.load(f"images/plr_left/plr_left{i}.png").convert_alpha()
            img = pygame.transform.scale(img, (self.rect.width, self.rect.height))
            self.frames_left.append(img)
        
        # image of the jump
        self.jump_right = pygame.image.load("images/plr_jump/plr_jump_right.png").convert_alpha()
        self.jump_right = pygame.transform.scale(self.jump_right, (self.rect.width, self.rect.height))
        self.jump_left = pygame.image.load("images/plr_jump/plr_jump_left.png").convert_alpha()
        self.jump_left = pygame.transform.scale(self.jump_left, (self.rect.width, self.rect.height))
        self.jump_default = pygame.image.load("images/plr_jump/plr_jump1.png").convert_alpha()
        self.jump_default = pygame.transform.scale(self.jump_default, (self.rect.width, self.rect.height))
        
        # Animation
        self.frame_index = 0
        self.frame_timer = 0
        self.frame_delay = 4  # Задержка между кадрами (меньше = быстрее)

    def move(self, keys):
        moving = False
        if keys[pygame.K_LEFT]:
            self.rect.x -= self.speed
            self.facing = "left"
            moving = True
            # Limit left edge
            if self.rect.x < 0:
                self.rect.x = 0
        if keys[pygame.K_RIGHT]:
            self.rect.x += self.speed
            self.facing = "right"
            moving = True
            # Limit right edge
            if self.rect.right > WIDTH:
                self.rect.right = WIDTH
        
        # Update animation
        if not self.on_ground:
            # Jump animation
            if keys[pygame.K_RIGHT]:
                self.image = self.jump_right
            elif keys[pygame.K_LEFT]:
                self.image = self.jump_left
            else:
                self.image = self.jump_default
        elif moving:
            self.frame_timer += 1
            if self.frame_timer >= self.frame_delay:
                self.frame_timer = 0
                self.frame_index = (self.frame_index + 1) % 3
                if self.facing == "right":
                    self.image = self.frames_right[self.frame_index]
                else:
                    self.image = self.frames_left[self.frame_index]
        else:
            # Сброс на исходное изображение
            self.image = self.default_image
            self.frame_index = 0

    def jump(self, keys):
        if (keys[pygame.K_SPACE] or keys[pygame.K_UP]) and self.on_ground:
            self.velocity_y = -15

    def apply_gravity(self):
        self.velocity_y += 1
        if self.velocity_y > 10:
            self.velocity_y = 10
        self.rect.y += self.velocity_y

    def update(self, platforms):
        self.on_ground = False
        previous_bottom = self.rect.bottom - self.velocity_y
        previous_top = self.rect.top - self.velocity_y

        for platform in platforms:
            if self.rect.colliderect(platform.rect):
                if self.velocity_y >= 0 and previous_bottom <= platform.rect.top:
                    # приземление сверху
                    self.rect.bottom = platform.rect.top
                    self.velocity_y = 0
                    self.on_ground = True
                elif self.velocity_y < 0 and previous_top >= platform.rect.bottom:
                    # удар о нижнюю часть платформы
                    self.rect.top = platform.rect.bottom
                    self.velocity_y = 0

    def draw(self, surface, offset_y):
        surface.blit(self.image, (self.rect.x, self.rect.y + offset_y))


class Platform:
    def __init__(self, x, y, w, h):
        self.rect = pygame.Rect(x, y, w, h)

    def draw(self, surface, offset_y):
        pygame.draw.rect(surface, (200, 200, 200),
                         (self.rect.x, self.rect.y + offset_y,
                          self.rect.width, self.rect.height))


# Шипы
class Spike:
    def __init__(self, x, y, width):
        self.image = pygame.image.load("images/spike2.png").convert_alpha()
        self.image = pygame.transform.scale(self.image, (width, 25))
        self.rect = self.image.get_rect(topleft=(x, y))

    def draw(self, surface, offset_y):
        surface.blit(self.image, (self.rect.x, self.rect.y + offset_y))


player = Player()

platforms = [
    Platform(200, 700, 200, 20),
    Platform(100, 600, 150, 20),
    Platform(350, 500, 150, 20),
    Platform(200, 400, 200, 20),
    Platform(100, 300, 150, 20),
    Platform(350, 200, 150, 20),
    Platform(200, 100, 200, 20),
    Platform(100, 0, 150, 20),
    Platform(350, -100, 150, 20),
    Platform(200, -200, 200, 20),
]

# Генерация шипов
spikes = []

SAFE_PLATFORMS = 3     # старт безопасный
TOP_SAFE_PLATFORMS = 2    # верх тоже безопасный
SPIKE_CHANCE = 0.6       # шанс появления
MIN_GAP = 70              # минимальная ширина центра шипов

total_platforms = len(platforms)

for i, platform in enumerate(platforms):
    # 1. старт безопасный
    if i < SAFE_PLATFORMS:
        continue

    # 2. верх безопасный
    if i >= total_platforms - TOP_SAFE_PLATFORMS:
        continue

    # 3. шанс появления
    if random.random() > SPIKE_CHANCE:
        continue

    # 4. размер центральной зоны шипов
    spike_width = random.randint(MIN_GAP, 80)

    # центрируем шипы на платформе
    center_x = platform.rect.centerx
    start_x = center_x - spike_width // 2

    # не вылезаем за границы платформы
    start_x = max(platform.rect.x + 10, start_x)
    end_x = min(platform.rect.right - 10, start_x + spike_width)

    final_width = end_x - start_x

    if final_width > 20:
        spikes.append(Spike(
            start_x,
            platform.rect.y - 25,
            final_width
        ))


camera_offset = 0
game_over = False

# Кнопка перезапуска
restart_btn = pygame.Rect(WIDTH // 2 - 80, HEIGHT - 100, 160, 50)

def reset_game():
    player.rect.x = 250
    player.rect.y = 600
    player.velocity_y = 0
    return 0


running = True
while running:
    screen.blit(bg, (0, 0))

    for event in pygame.event.get():
        if event.type == pygame.QUIT:
            running = False
        if game_over and event.type == pygame.MOUSEBUTTONDOWN:
            mouse_pos = event.pos
            if restart_btn.collidepoint(mouse_pos):
                camera_offset = reset_game()
                game_over = False

    if not game_over:
        keys = pygame.key.get_pressed()

        player.move(keys)
        player.jump(keys)
        player.apply_gravity()
        player.update(platforms)

        if player.rect.y < HEIGHT // 2:
            camera_offset = HEIGHT // 2 - player.rect.y

        # смерть от шипов
        for spike in spikes:
            if player.rect.colliderect(spike.rect):
                game_over = True

        # Проверка на падение вниз
        if player.rect.y > HEIGHT + 100:
            game_over = True

    for platform in platforms:
        platform.draw(screen, camera_offset)

    for spike in spikes:
        spike.draw(screen, camera_offset)

    player.draw(screen, camera_offset)

    if game_over:
        # Текст Game Over
        text = font.render("Game Over", True, (255, 50, 50))
        text_rect = text.get_rect(center=(WIDTH // 2, HEIGHT // 2 - 50))
        screen.blit(text, text_rect)

        # Кнопка Try again
        pygame.draw.rect(screen, (100, 200, 100), restart_btn)
        btn_text = font_small.render("Try again", True, (255, 255, 255))
        btn_rect = btn_text.get_rect(center=restart_btn.center)
        screen.blit(btn_text, btn_rect)

    pygame.display.update()
    clock.tick(60)

pygame.quit()