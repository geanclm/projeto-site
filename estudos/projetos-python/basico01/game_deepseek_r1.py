import pygame
import math
import sys

# Initialize Pygame
pygame.init()

# Screen dimensions
WIDTH, HEIGHT = 800, 600
screen = pygame.display.set_mode((WIDTH, HEIGHT))
pygame.display.set_caption("Bouncing Ball in Rotating Hexagon")

# Colors
BLACK = (0, 0, 0)
WHITE = (255, 255, 255)
RED = (255, 0, 0)
BLUE = (0, 0, 255)
YELLOW = (255, 255, 0)

# Helper function to calculate distance from a point to a line segment
def distance_point_to_segment(P, A, B):
    dx = B[0] - A[0]
    dy = B[1] - A[1]
    if dx == 0 and dy == 0:
        dist = math.hypot(P[0] - A[0], P[1] - A[1])
        return dist, A
    t = ((P[0] - A[0]) * dx + (P[1] - A[1]) * dy) / (dx * dx + dy * dy)
    t = max(0, min(1, t))
    closest = (A[0] + t * dx, A[1] + t * dy)
    dist = math.hypot(P[0] - closest[0], P[1] - closest[1])
    return dist, closest

# Hexagon class
class Hexagon:
    def __init__(self, center, radius, rotation_speed):
        self.center = center
        self.radius = radius
        self.rotation_speed = rotation_speed
        self.angle = 0.0

    def update(self, delta_time):
        self.angle += self.rotation_speed * delta_time

    def get_vertices(self):
        vertices = []
        for i in range(6):
            theta = math.radians(i * 60 + math.degrees(self.angle))
            x = self.center[0] + self.radius * math.cos(theta)
            y = self.center[1] + self.radius * math.sin(theta)
            vertices.append((x, y))
        return vertices

    def get_edges(self):
        vertices = self.get_vertices()
        return [(vertices[i], vertices[(i + 1) % 6]) for i in range(6)]

    def draw(self, screen):
        vertices = self.get_vertices()
        pygame.draw.lines(screen, WHITE, True, vertices, 2)

# Ball class
class Ball:
    def __init__(self, x, y, radius, color):
        self.x = x
        self.y = y
        self.radius = radius
        self.color = color
        self.vx = 0.0
        self.vy = 0.0

    def apply_physics(self, gravity, friction_coeff, delta_time):
        self.vy += gravity * delta_time
        self.vx *= math.exp(-friction_coeff * delta_time)
        self.vy *= math.exp(-friction_coeff * delta_time)

    def update_position(self, delta_time):
        self.x += self.vx * delta_time
        self.y += self.vy * delta_time

    def draw(self, screen):
        pygame.draw.circle(screen, self.color, (int(self.x), int(self.y)), self.radius)

# Main function
def main():
    # Initial parameters
    gravity = 9.8 * 50  # Scaled for simulation
    friction_coeff = 2.0
    rotation_speed = math.pi / 2  # Radians per second
    ball_radius = 15
    restitution = 0.8  # Bounciness

    # Create hexagon and ball
    hexagon = Hexagon((WIDTH // 2, HEIGHT // 2), 200, rotation_speed)
    ball = Ball(WIDTH // 2, HEIGHT // 2, ball_radius, RED)

    # Fonts for text rendering
    param_font = pygame.font.SysFont(None, 36)
    title_font = pygame.font.SysFont(None, 48)
    title_surface = title_font.render("DeepSeek R1", True, WHITE)

    # Clock for frame rate control
    clock = pygame.time.Clock()
    running = True
    prev_time = pygame.time.get_ticks() / 1000.0

    while running:
        # Calculate delta time
        current_time = pygame.time.get_ticks() / 1000.0
        delta_time = current_time - prev_time
        prev_time = current_time

        # Event handling
        for event in pygame.event.get():
            if event.type == pygame.QUIT:
                running = False
            elif event.type == pygame.KEYDOWN and event.key == pygame.K_ESCAPE:
                running = False

        # Adjust parameters with keyboard input
        keys = pygame.key.get_pressed()
        if keys[pygame.K_UP]: hexagon.rotation_speed += 0.1
        if keys[pygame.K_DOWN]: hexagon.rotation_speed -= 0.1
        if keys[pygame.K_LEFT]: gravity -= 10
        if keys[pygame.K_RIGHT]: gravity += 10
        if keys[pygame.K_f]: friction_coeff += 0.1
        if keys[pygame.K_v]: friction_coeff = max(0.1, friction_coeff - 0.1)
        if keys[pygame.K_r]:  # Reset ball
            ball.x, ball.y = WIDTH // 2, HEIGHT // 2
            ball.vx, ball.vy = 0, 0

        # Update hexagon and ball
        hexagon.update(delta_time)
        ball.apply_physics(gravity, friction_coeff, delta_time)
        ball.update_position(delta_time)

        # Collision detection and response
        edges = hexagon.get_edges()
        for edge in edges:
            A, B = edge
            dist, closest = distance_point_to_segment((ball.x, ball.y), A, B)
            if dist < ball.radius:
                dx, dy = B[0] - A[0], B[1] - A[1]
                normal = (-dy, dx)
                norm_length = math.hypot(normal[0], normal[1])
                if norm_length == 0: continue
                normal = (normal[0] / norm_length, normal[1] / norm_length)

                rel_x, rel_y = closest[0] - hexagon.center[0], closest[1] - hexagon.center[1]
                omega = hexagon.rotation_speed
                v_wall = (-rel_y * omega, rel_x * omega)

                v_rel_x, v_rel_y = ball.vx - v_wall[0], ball.vy - v_wall[1]
                vn = v_rel_x * normal[0] + v_rel_y * normal[1]

                if vn < 0:
                    j = -(1 + restitution) * vn
                    ball.vx += j * normal[0]
                    ball.vy += j * normal[1]
                    ball.vx += v_wall[0]
                    ball.vy += v_wall[1]

                    penetration = ball.radius - dist
                    ball.x += normal[0] * penetration
                    ball.y += normal[1] * penetration

        # Clear screen and draw objects
        screen.fill(BLACK)
        hexagon.draw(screen)
        ball.draw(screen)

        # Draw rotating text
        rotated_title = pygame.transform.rotate(title_surface, -math.degrees(hexagon.angle))
        title_rect = rotated_title.get_rect(center=hexagon.center)
        screen.blit(rotated_title, title_rect)

        # Display parameters
        params = f"Rotation: {hexagon.rotation_speed:.2f} rad/s, Gravity: {gravity:.2f}, Friction: {friction_coeff:.2f}"
        param_surface = param_font.render(params, True, WHITE)
        screen.blit(param_surface, (10, 10))

        # Update display
        pygame.display.flip()
        clock.tick(60)

    pygame.quit()
    sys.exit()

if __name__ == "__main__":
    main()