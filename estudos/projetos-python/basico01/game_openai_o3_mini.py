import pygame
import math
import sys

# Initialize Pygame
pygame.init()

# Screen dimensions
WIDTH, HEIGHT = 800, 600
screen = pygame.display.set_mode((WIDTH, HEIGHT))
pygame.display.set_caption("Bouncing Ball in Rotating Hexagon")

clock = pygame.time.Clock()

# Adjustable parameters
ROTATION_SPEED = 0.01      # Radians per frame (adjust for faster/slower rotation)
GRAVITY = 0.3              # Gravity acceleration (pixels per frame^2)
FRICTION = 0.995           # Friction coefficient (velocity is multiplied by this each frame)
BALL_RADIUS = 10
HEXAGON_RADIUS = 250

# Colors
BACKGROUND_COLOR = (30, 30, 30)
HEXAGON_COLOR = (0, 150, 255)
BALL_COLOR = (255, 80, 80)
TEXT_COLOR = (255, 255, 255)

# Ball initial properties
ball_pos = pygame.Vector2(WIDTH / 2, HEIGHT / 2 - 100)
ball_vel = pygame.Vector2(3, 0)

# Hexagon properties
hex_center = pygame.Vector2(WIDTH / 2, HEIGHT / 2)
hex_angle = 0  # current rotation angle

# Prepare text (we will rotate the text surface)
font = pygame.font.SysFont("Arial", 32)
title_text = "OpenAI 03-mini"  # or "DeepSeek R1"
text_surface = font.render(title_text, True, TEXT_COLOR)
text_rect = text_surface.get_rect(center=(HEXAGON_RADIUS, HEXAGON_RADIUS))  # relative center

def get_hexagon_vertices(center, radius, angle_offset):
    """Return a list of 6 vertices (pygame.Vector2) for a hexagon centered at center."""
    vertices = []
    for i in range(6):
        angle = angle_offset + math.radians(60 * i)
        x = center.x + radius * math.cos(angle)
        y = center.y + radius * math.sin(angle)
        vertices.append(pygame.Vector2(x, y))
    return vertices

def closest_point_on_segment(p, a, b):
    """Return the closest point on segment ab to point p."""
    ap = p - a
    ab = b - a
    ab_len_sq = ab.length_squared()
    if ab_len_sq == 0:
        return a
    t = max(0, min(1, ap.dot(ab) / ab_len_sq))
    return a + ab * t

def reflect_velocity(velocity, normal):
    """Reflect velocity along the given normal vector."""
    return velocity - 2 * velocity.dot(normal) * normal

running = True
while running:
    dt = clock.tick(60) / 1000.0  # seconds per frame (not used directly here but could help for physics scaling)
    for event in pygame.event.get():
        if event.type == pygame.QUIT:
            running = False

    # Update hexagon rotation
    hex_angle += ROTATION_SPEED

    # Get hexagon vertices based on the current rotation
    hex_vertices = get_hexagon_vertices(hex_center, HEXAGON_RADIUS, hex_angle)

    # Update ball physics
    # Apply gravity (downward)
    ball_vel.y += GRAVITY

    # Apply friction
    ball_vel *= FRICTION

    # Update ball position
    ball_pos += ball_vel

    # Check collision with each hexagon wall
    for i in range(len(hex_vertices)):
        a = hex_vertices[i]
        b = hex_vertices[(i + 1) % len(hex_vertices)]
        closest = closest_point_on_segment(ball_pos, a, b)
        distance = (ball_pos - closest).length()

        if distance < BALL_RADIUS:
            # Collision detected. Compute the collision normal.
            normal = ball_pos - closest
            if normal.length() == 0:
                continue  # Avoid division by zero
            normal = normal.normalize()

            # Adjust ball position to avoid sinking into the wall
            overlap = BALL_RADIUS - distance
            ball_pos += normal * overlap

            # Reflect the velocity vector along the normal
            ball_vel = reflect_velocity(ball_vel, normal)

    # Clear the screen
    screen.fill(BACKGROUND_COLOR)

    # Draw the hexagon
    pygame.draw.polygon(screen, HEXAGON_COLOR, [v.xy for v in hex_vertices], 5)

    # Draw the ball
    pygame.draw.circle(screen, BALL_COLOR, (int(ball_pos.x), int(ball_pos.y)), BALL_RADIUS)

    # Draw rotating text at the center of the hexagon.
    # First, rotate the text surface to match hexagon rotation (in degrees)
    angle_degrees = -math.degrees(hex_angle)  # negative to rotate text with the hexagon
    rotated_text = pygame.transform.rotozoom(text_surface, angle_degrees, 1)
    rotated_rect = rotated_text.get_rect(center=hex_center)
    screen.blit(rotated_text, rotated_rect)

    pygame.display.flip()

pygame.quit()
sys.exit()